package expo.modules.clipflowvideo

import android.graphics.Bitmap
import android.graphics.Color
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import androidx.annotation.OptIn
import androidx.media3.common.Effect
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.OverlaySettings
import androidx.media3.common.audio.AudioProcessor
import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.StaticOverlaySettings
import androidx.media3.effect.TextOverlay
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.EditedMediaItemSequence
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.ProgressHolder
import androidx.media3.transformer.Transformer
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import kotlin.math.max
import kotlin.math.min

/**
 * Exportação real de vídeo no dispositivo.
 *
 * Usa o Media3 Transformer para cortar cada clipe (ClippingConfiguration), concatenar
 * tudo numa sequência e desenhar os textos por cima. O resultado é um MP4 H.264/AAC.
 */
@OptIn(UnstableApi::class)
class ClipFlowVideoModule : Module() {

  private val handler = Handler(Looper.getMainLooper())
  private var transformer: Transformer? = null
  private var progressRunnable: Runnable? = null

  override fun definition() = ModuleDefinition {
    Name("ClipFlowVideo")

    Events("onExportProgress")

    AsyncFunction("probe") { uri: String ->
      probe(uri)
    }

    AsyncFunction("export") { specJson: String, promise: Promise ->
      export(specJson, promise)
    }

    AsyncFunction("cancel") {
      cancelExport()
      true
    }

    OnDestroy {
      cancelExport()
    }
  }

  // ------------------------------------------------------------------ probe

  private fun probe(uri: String): Map<String, Any?> {
    val retriever = MediaMetadataRetriever()
    try {
      if (uri.startsWith("content://")) {
        retriever.setDataSource(context(), Uri.parse(uri))
      } else {
        retriever.setDataSource(uri.removePrefix("file://"))
      }
      val duration = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
        ?.toLongOrNull() ?: 0L
      val width = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
        ?.toIntOrNull() ?: 0
      val height = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
        ?.toIntOrNull() ?: 0
      val rotation = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
        ?.toIntOrNull() ?: 0
      val hasAudio = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO) == "yes"

      return mapOf(
        "durationMs" to duration,
        "width" to width,
        "height" to height,
        "rotation" to rotation,
        "hasAudio" to hasAudio
      )
    } catch (error: Throwable) {
      throw CodedException("PROBE_FAILED", error.message ?: "Não foi possível ler o vídeo", error)
    } finally {
      retriever.release()
    }
  }

  // ----------------------------------------------------------------- export

  private fun export(specJson: String, promise: Promise) {
    handler.post {
      try {
        cancelExport()

        val spec = JSONObject(specJson)
        val clipsJson = spec.optJSONArray("clips") ?: JSONArray()
        if (clipsJson.length() == 0) {
          throw CodedException("EMPTY_PROJECT", "Adicione pelo menos um clipe antes de exportar")
        }

        val outputPath = spec.getString("outputPath")
        val outputFile = File(outputPath)
        outputFile.parentFile?.mkdirs()
        if (outputFile.exists()) outputFile.delete()

        val texts = parseTexts(spec.optJSONArray("texts"))

        val clips = ArrayList<ClipSpec>(clipsJson.length())
        for (index in 0 until clipsJson.length()) {
          val item = clipsJson.getJSONObject(index)
          val startMs = item.optLong("startMs", 0L)
          val endMs = item.optLong("endMs", -1L)
          clips += ClipSpec(
            uri = item.getString("uri"),
            startMs = startMs,
            endMs = if (endMs > startMs) endMs else startMs + 1
          )
        }

        var offsetMs = 0L
        val editedItems = clips.map { clip ->
          val durationMs = (clip.endMs - clip.startMs).coerceAtLeast(1)
          val mediaItem = MediaItem.Builder()
            .setUri(clip.uri)
            .setClippingConfiguration(
              MediaItem.ClippingConfiguration.Builder()
                .setStartPositionMs(clip.startMs)
                .setEndPositionMs(clip.endMs)
                .build()
            )
            .build()

          val effects = textEffects(clips = clip, clipOffsetMs = offsetMs, texts = texts)
          offsetMs += durationMs

          EditedMediaItem.Builder(mediaItem)
            .setEffects(Effects(emptyList<AudioProcessor>(), effects))
            .build()
        }

        val sequence = EditedMediaItemSequence.Builder(editedItems).build()
        val composition = Composition.Builder(sequence)
          .experimentalSetForceAudioTrack(true)
          .build()

        val exportTransformer = Transformer.Builder(context())
          .setVideoMimeType(MimeTypes.VIDEO_H264)
          .setAudioMimeType(MimeTypes.AUDIO_AAC)
          .addListener(object : Transformer.Listener {
            override fun onCompleted(composition: Composition, exportResult: ExportResult) {
              stopProgress()
              transformer = null
              promise.resolve(outputPath)
            }

            override fun onError(
              composition: Composition,
              exportResult: ExportResult,
              exportException: ExportException
            ) {
              stopProgress()
              transformer = null
              promise.reject(
                "EXPORT_FAILED",
                exportException.message ?: "Falha ao renderizar o vídeo",
                exportException
              )
            }
          })
          .build()

        transformer = exportTransformer
        exportTransformer.start(composition, outputPath)
        startProgress()
      } catch (error: Throwable) {
        stopProgress()
        transformer = null
        promise.reject(
          "EXPORT_FAILED",
          error.message ?: "Falha ao preparar a exportação",
          error
        )
      }
    }
  }

  private fun startProgress() {
    val holder = ProgressHolder()
    val runnable = object : Runnable {
      override fun run() {
        val current = transformer ?: return
        val state = current.getProgress(holder)
        if (state == Transformer.PROGRESS_STATE_AVAILABLE) {
          sendEvent("onExportProgress", mapOf("progress" to holder.progress))
        }
        handler.postDelayed(this, 250)
      }
    }
    progressRunnable = runnable
    handler.postDelayed(runnable, 250)
  }

  private fun stopProgress() {
    progressRunnable?.let { handler.removeCallbacks(it) }
    progressRunnable = null
  }

  private fun cancelExport() {
    stopProgress()
    try {
      transformer?.cancel()
    } catch (_: Throwable) {
      // cancelar é best-effort
    }
    transformer = null
  }

  private fun context() = appContext.reactContext
    ?: throw CodedException("NO_CONTEXT", "Contexto Android indisponível")

  // ------------------------------------------------------------- overlays

  private fun parseTexts(array: JSONArray?): List<TextSpec> {
    if (array == null) return emptyList()
    val result = ArrayList<TextSpec>(array.length())
    for (index in 0 until array.length()) {
      val item = array.getJSONObject(index)
      val text = item.optString("text").trim()
      if (text.isEmpty()) continue
      result += TextSpec(
        text = text,
        startMs = item.optLong("startMs", 0L),
        endMs = item.optLong("endMs", Long.MAX_VALUE),
        color = parseColor(item.optString("color", "#FFFFFF")),
        sizePx = item.optDouble("sizePx", 72.0).toFloat(),
        x = item.optDouble("x", 0.0).toFloat(),
        y = item.optDouble("y", -0.62).toFloat()
      )
    }
    return result
  }

  private fun textEffects(clip: ClipSpec, clipOffsetMs: Long, texts: List<TextSpec>): List<Effect> {
    val clipDurationMs = (clip.endMs - clip.startMs).coerceAtLeast(1)
    val clipEndMs = clipOffsetMs + clipDurationMs
    val effects = ArrayList<Effect>()

    for (text in texts) {
      val start = max(text.startMs, clipOffsetMs)
      val end = min(text.endMs, clipEndMs)
      if (end <= start) continue

      effects += TimedTextOverlay(
        text = text.text,
        color = text.color,
        scale = (text.sizePx / 100f).coerceIn(0.3f, 4f),
        startUs = (start - clipOffsetMs) * 1000,
        endUs = (end - clipOffsetMs) * 1000,
        anchorX = text.x,
        anchorY = text.y
      )
    }

    return effects
  }

  private fun parseColor(value: String): Int {
    return try {
      Color.parseColor(value)
    } catch (_: Throwable) {
      Color.WHITE
    }
  }

  private data class ClipSpec(val uri: String, val startMs: Long, val endMs: Long)

  private data class TextSpec(
    val text: String,
    val startMs: Long,
    val endMs: Long,
    val color: Int,
    val sizePx: Float,
    val x: Float,
    val y: Float
  )

  /**
   * Texto desenhado por cima do vídeo apenas entre [startUs] e [endUs].
   * Fora da janela devolve um bitmap transparente de 1x1.
   */
  private class TimedTextOverlay(
    text: String,
    color: Int,
    scale: Float,
    private val startUs: Long,
    private val endUs: Long,
    anchorX: Float,
    anchorY: Float
  ) : BitmapOverlay() {

    private val settings: OverlaySettings = StaticOverlaySettings.Builder()
      .setBackgroundFrameAnchor(anchorX, anchorY)
      .setOverlayFrameAnchor(0f, 0f)
      .setScale(1f, 1f)
      .build()

    private val delegate: TextOverlay = TextOverlay.createStaticTextOverlay(
      SpannableString(text).apply {
        setSpan(ForegroundColorSpan(color), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSpan(RelativeSizeSpan(scale), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      },
      settings as StaticOverlaySettings
    )

    private val empty: Bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)

    override fun getBitmap(presentationTimeUs: Long): Bitmap {
      return if (presentationTimeUs in startUs until endUs) {
        delegate.getBitmap(presentationTimeUs)
      } else {
        empty
      }
    }

    override fun getOverlaySettings(presentationTimeUs: Long): OverlaySettings = settings
  }
}

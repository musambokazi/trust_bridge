package za.co.devpeeps.trustbridge.documents

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import androidx.exifinterface.media.ExifInterface
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.max
import kotlin.math.roundToInt

class TrustBridgeDocumentsModule : Module() {
  private val executor = Executors.newSingleThreadExecutor()
  private val running = AtomicBoolean(false)
  private val cancelled = AtomicBoolean(false)

  override fun definition() = ModuleDefinition {
    Name("TrustBridgeDocuments")
    Function("cancel") { cancelled.set(true) }
    AsyncFunction("read") { uri: String, pdf: Boolean, promise: Promise ->
      if (!running.compareAndSet(false, true)) {
        promise.reject("ERR_IMPORT_BUSY", "The previous import is finishing. Try again shortly.", null)
      } else {
        cancelled.set(false)
        val cache = appContext.reactContext?.cacheDir
        executor.execute {
          var recognizer: TextRecognizer? = null
          try {
            val parsed = Uri.parse(uri)
            require(parsed.scheme == "file" && cache != null) { "Choose a local invoice file." }
            val file = File(parsed.path ?: "").canonicalFile
            require(file.path.startsWith(cache!!.canonicalPath + File.separator)) { "Invoice must be in the app's temporary folder." }
            require(file.isFile && file.length() in 1..20971520L) { "Choose a file smaller than 20 MB." }
            recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            val result = if (pdf) readPdf(file, recognizer!!) else {
              val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
              BitmapFactory.decodeFile(file.path, bounds)
              require(bounds.outWidth > 0 && bounds.outHeight > 0) { "This image could not be read." }
              var sample = 1
              while (max(bounds.outWidth, bounds.outHeight) / sample > 2400) sample *= 2
              val bitmap = BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample })
                ?: throw IllegalArgumentException("This image could not be read.")
              var oriented = bitmap
              try {
                val orientation = try { ExifInterface(file.path).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL) } catch (_: Exception) { ExifInterface.ORIENTATION_NORMAL }
                val matrix = Matrix()
                when (orientation) {
                  ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
                  ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                  ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
                  ExifInterface.ORIENTATION_TRANSPOSE -> { matrix.postRotate(90f); matrix.postScale(-1f, 1f) }
                  ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                  ExifInterface.ORIENTATION_TRANSVERSE -> { matrix.postRotate(270f); matrix.postScale(-1f, 1f) }
                  ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                }
                if (!matrix.isIdentity) oriented = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                mapOf("text" to recognize(oriented, recognizer!!), "pages" to 1)
              } finally { if (oriented !== bitmap) oriented.recycle(); bitmap.recycle() }
            }
            check(!cancelled.get()) { "Import cancelled." }
            promise.resolve(result)
          } catch (error: Exception) {
            // Do not include invoice contents, paths or SDK diagnostics in errors/logs.
            val message = if (cancelled.get()) "Import cancelled." else when (error) {
              is SecurityException -> "Locked PDFs are not supported. Use an unlocked copy or enter details manually."
              is IllegalArgumentException -> error.message ?: "This file could not be read."
              else -> "Unable to read this invoice. Try a clear photo, an unlocked PDF or manual entry."
            }
            promise.reject("ERR_INVOICE_IMPORT", message, null)
          } finally {
            recognizer?.close()
            running.set(false)
          }
        }
      }
    }
    OnDestroy { cancelled.set(true); executor.shutdownNow() }
  }

  private fun recognize(bitmap: Bitmap, recognizer: TextRecognizer): String {
    check(!cancelled.get()) { "Import cancelled." }
    val result = Tasks.await(recognizer.process(InputImage.fromBitmap(bitmap, 0)), 15, TimeUnit.SECONDS)
    require(result.text.length <= 50000) { "Too much text. Import a shorter invoice." }
    return result.text
  }

  private fun readPdf(file: File, recognizer: TextRecognizer): Map<String, Any> {
    val header = ByteArray(5)
    file.inputStream().use { require(it.read(header) == 5 && String(header, Charsets.US_ASCII) == "%PDF-") { "Choose a valid PDF." } }
    ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
      PdfRenderer(descriptor).use { renderer ->
        require(renderer.pageCount in 1..5) { "Import a PDF with 1 to 5 pages." }
        val text = StringBuilder()
        for (index in 0 until renderer.pageCount) {
          check(!cancelled.get()) { "Import cancelled." }
          renderer.openPage(index).use { page ->
            require(page.width > 0 && page.height > 0) { "This PDF page could not be read." }
            val scale = 2000.0 / max(page.width, page.height)
            val bitmap = Bitmap.createBitmap(max(1, (page.width * scale).roundToInt()), max(1, (page.height * scale).roundToInt()), Bitmap.Config.ARGB_8888)
            try {
              bitmap.eraseColor(Color.WHITE)
              page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
              text.append(recognize(bitmap, recognizer)).append('\n')
              require(text.length <= 50000) { "Too much text. Import a shorter invoice." }
            } finally { bitmap.recycle() }
          }
        }
        return mapOf("text" to text.toString(), "pages" to renderer.pageCount)
      }
    }
  }
}

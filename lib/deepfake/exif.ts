import exifr from "exifr";

export type ExifResult = {
  hasMetadata: boolean;
  software?: string;
  createDate?: string;
  modifyDate?: string;
  gpsLat?: number;
  gpsLon?: number;
  make?: string;
  model?: string;
  editingTraces: string[];
  suspicious: boolean;
};

export async function extractExif(file: File): Promise<ExifResult> {
  try {
    const output = await exifr.parse(file, {
      translateKeys: false,
      reviveValues: false,
    });

    if (!output || Object.keys(output).length === 0) {
      return {
        hasMetadata: false,
        editingTraces: ["No EXIF metadata found — may be stripped by AI generation tools"],
        suspicious: true,
      };
    }

    const traces: string[] = [];
    let suspicious = false;

    // Check for editing software
    const software = output.Software || output.ProcessingSoftware || "";
    if (software) {
      traces.push(`Editing software detected: ${software}`);
      const editingTools = ["photoshop", "lightroom", "faceapp", "remini", "picsart", "snapseed", "meitu"];
      if (editingTools.some((t) => software.toLowerCase().includes(t))) {
        suspicious = true;
        traces.push(`⚠ Editing tool "${software}" often used for manipulation`);
      }
    }

    // Check create/modify date
    const createDate = output.DateTimeOriginal || output.CreateDate || "";
    const modifyDate = output.ModifyDate || "";
    if (createDate && modifyDate && createDate !== modifyDate) {
      traces.push("Modified after original capture (date mismatch)");
      suspicious = true;
    }

    // Check device info
    const make = output.Make || "";
    const model = output.Model || "";
    if (make) {
      traces.push(`Camera/device: ${make} ${model}`.trim());
    } else if (!software) {
      // No camera info and no software = potentially stripped
      traces.push("No camera/device metadata — may be generated or stripped");
      suspicious = true;
    }

    // Check GPS
    const gpsLat = output.latitude || output.GPSLatitude;
    const gpsLon = output.longitude || output.GPSLongitude;
    if (gpsLat && gpsLon) {
      traces.push(`GPS location embedded`);
    }

    return {
      hasMetadata: true,
      software,
      createDate,
      modifyDate,
      gpsLat,
      gpsLon,
      make,
      model,
      editingTraces: traces,
      suspicious,
    };
  } catch (err) {
    console.warn("[EXIF] Failed to parse:", err);
    return {
      hasMetadata: false,
      editingTraces: ["EXIF parsing failed"],
      suspicious: false,
    };
  }
}

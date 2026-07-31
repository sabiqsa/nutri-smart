const QR_PREFIX = "NUTRISMART:RM:";

export function buildPatientQrValue(medicalRecordNumber: string): string {
  return `${QR_PREFIX}${medicalRecordNumber}`;
}

/** Returns the RM number if `raw` is a NutriSmart patient QR code, else null. */
export function parsePatientQrValue(raw: string): string | null {
  if (!raw.startsWith(QR_PREFIX)) {
    return null;
  }
  const rm = raw.slice(QR_PREFIX.length).trim();
  return rm === "" ? null : rm;
}

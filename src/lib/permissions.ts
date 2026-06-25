// =============================================================================
// PermissionGuard — Permission Dictionary / Knowledge Base
// -----------------------------------------------------------------------------
// This is the single source of truth for every supported permission. The risk
// engine, the manual selection UI, and the permission dictionary page all read
// from this structured data. Add a new permission here and it appears
// everywhere automatically.
// =============================================================================

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type PermissionCategory =
  | "privacy"
  | "surveillance"
  | "location"
  | "device-control"
  | "general";

export interface PermissionDef {
  /** Normalized key, e.g. READ_SMS */
  key: string;
  /** Canonical Android manifest name, e.g. android.permission.READ_SMS */
  androidName: string;
  /** Human friendly label */
  label: string;
  category: PermissionCategory;
  /** Base points this permission contributes to the risk score */
  baseRiskScore: number;
  riskLevel: RiskLevel;
  /** What the permission allows the app to do */
  description: string;
  /** What kind of data / capability it exposes */
  dataAccess: string;
  /** Plain language reason it can be dangerous */
  whyDangerous: string;
}

export const CATEGORY_META: Record<
  PermissionCategory,
  { label: string; blurb: string }
> = {
  privacy: {
    label: "Privacy-sensitive",
    blurb: "Access to personal data such as contacts, messages and files.",
  },
  surveillance: {
    label: "Surveillance / Recording",
    blurb: "Ability to see, hear or monitor what you and your device do.",
  },
  location: {
    label: "Location",
    blurb: "Ability to determine where the device physically is.",
  },
  "device-control": {
    label: "Device control / High-risk",
    blurb: "Powerful control over the device, often abused by malware.",
  },
  general: {
    label: "General",
    blurb: "Common, low-risk permissions most apps request.",
  },
};

// -----------------------------------------------------------------------------
// The permission dictionary
// -----------------------------------------------------------------------------
export const PERMISSIONS: PermissionDef[] = [
  // ---- Privacy-sensitive ----------------------------------------------------
  {
    key: "READ_CONTACTS",
    androidName: "android.permission.READ_CONTACTS",
    label: "Read Contacts",
    category: "privacy",
    baseRiskScore: 10,
    riskLevel: "Moderate",
    description: "Allows the app to read your saved contacts.",
    dataAccess: "Names, phone numbers, emails of everyone you know.",
    whyDangerous:
      "Your entire social graph can be uploaded and used for spam, scams or profiling.",
  },
  {
    key: "WRITE_CONTACTS",
    androidName: "android.permission.WRITE_CONTACTS",
    label: "Modify Contacts",
    category: "privacy",
    baseRiskScore: 8,
    riskLevel: "Moderate",
    description: "Allows the app to add, change or delete your contacts.",
    dataAccess: "Write access to your address book.",
    whyDangerous:
      "Malicious apps can inject fake contacts or silently alter saved numbers.",
  },
  {
    key: "READ_SMS",
    androidName: "android.permission.READ_SMS",
    label: "Read SMS",
    category: "privacy",
    baseRiskScore: 15,
    riskLevel: "High",
    description: "Allows the app to read your text messages.",
    dataAccess: "SMS content including OTPs, banking alerts and private texts.",
    whyDangerous:
      "One-time passwords and 2FA codes can be intercepted to hijack accounts.",
  },
  {
    key: "SEND_SMS",
    androidName: "android.permission.SEND_SMS",
    label: "Send SMS",
    category: "privacy",
    baseRiskScore: 15,
    riskLevel: "High",
    description: "Allows the app to send text messages on your behalf.",
    dataAccess: "Outgoing SMS, including premium-rate numbers.",
    whyDangerous:
      "Apps can rack up charges or send spam/phishing from your number without consent.",
  },
  {
    key: "READ_CALL_LOG",
    androidName: "android.permission.READ_CALL_LOG",
    label: "Read Call Log",
    category: "privacy",
    baseRiskScore: 15,
    riskLevel: "High",
    description: "Allows the app to read your phone call history.",
    dataAccess: "Who you called, who called you, durations and timestamps.",
    whyDangerous:
      "Reveals private relationships and behavioural patterns useful for surveillance.",
  },
  {
    key: "WRITE_CALL_LOG",
    androidName: "android.permission.WRITE_CALL_LOG",
    label: "Modify Call Log",
    category: "privacy",
    baseRiskScore: 12,
    riskLevel: "High",
    description: "Allows the app to change your call history.",
    dataAccess: "Write access to call records.",
    whyDangerous: "Can hide malicious calls or fabricate fake call records.",
  },
  {
    key: "READ_EXTERNAL_STORAGE",
    androidName: "android.permission.READ_EXTERNAL_STORAGE",
    label: "Read Storage",
    category: "privacy",
    baseRiskScore: 6,
    riskLevel: "Moderate",
    description: "Allows the app to read files on shared storage.",
    dataAccess: "Photos, documents, downloads and other saved files.",
    whyDangerous: "Sensitive personal files can be scanned and exfiltrated.",
  },
  {
    key: "WRITE_EXTERNAL_STORAGE",
    androidName: "android.permission.WRITE_EXTERNAL_STORAGE",
    label: "Write Storage",
    category: "privacy",
    baseRiskScore: 8,
    riskLevel: "Moderate",
    description: "Allows the app to modify or delete files on shared storage.",
    dataAccess: "Write access to your files.",
    whyDangerous:
      "Files can be altered, encrypted (ransomware) or replaced with malware.",
  },
  {
    key: "READ_MEDIA_IMAGES",
    androidName: "android.permission.READ_MEDIA_IMAGES",
    label: "Read Photos",
    category: "privacy",
    baseRiskScore: 6,
    riskLevel: "Moderate",
    description: "Allows the app to read images in your gallery.",
    dataAccess: "All photos and screenshots stored on the device.",
    whyDangerous:
      "Private or sensitive images (IDs, screenshots of texts) can be harvested.",
  },
  {
    key: "READ_MEDIA_VIDEO",
    androidName: "android.permission.READ_MEDIA_VIDEO",
    label: "Read Videos",
    category: "privacy",
    baseRiskScore: 6,
    riskLevel: "Moderate",
    description: "Allows the app to read videos in your gallery.",
    dataAccess: "All videos stored on the device.",
    whyDangerous: "Private recordings can be accessed and uploaded.",
  },
  {
    key: "READ_CLIPBOARD",
    androidName: "android.permission.READ_CLIPBOARD",
    label: "Clipboard Access",
    category: "privacy",
    baseRiskScore: 8,
    riskLevel: "Moderate",
    description: "Allows the app to read clipboard contents.",
    dataAccess: "Anything you copy: passwords, addresses, 2FA codes.",
    whyDangerous:
      "Clipboard sniffing is a common way to steal copied passwords and crypto addresses.",
  },

  // ---- Surveillance / Recording --------------------------------------------
  {
    key: "CAMERA",
    androidName: "android.permission.CAMERA",
    label: "Camera",
    category: "surveillance",
    baseRiskScore: 10,
    riskLevel: "Moderate",
    description: "Allows the app to take pictures and record video.",
    dataAccess: "Live camera feed, photos and video.",
    whyDangerous: "Can capture your surroundings or you, potentially covertly.",
  },
  {
    key: "RECORD_AUDIO",
    androidName: "android.permission.RECORD_AUDIO",
    label: "Microphone",
    category: "surveillance",
    baseRiskScore: 12,
    riskLevel: "High",
    description: "Allows the app to record audio with the microphone.",
    dataAccess: "Anything the microphone can hear.",
    whyDangerous: "Enables eavesdropping on private conversations.",
  },
  {
    key: "SCREEN_CAPTURE",
    androidName: "android.permission.SCREEN_CAPTURE",
    label: "Screen Capture",
    category: "surveillance",
    baseRiskScore: 15,
    riskLevel: "High",
    description: "Allows the app to record or screenshot your screen.",
    dataAccess: "Everything displayed on screen, across all apps.",
    whyDangerous:
      "Passwords, messages and banking screens can be recorded silently.",
  },
  {
    key: "NOTIFICATION_ACCESS",
    androidName: "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
    label: "Notification Access",
    category: "surveillance",
    baseRiskScore: 10,
    riskLevel: "Moderate",
    description: "Allows the app to read all of your notifications.",
    dataAccess: "Message previews, OTPs and alerts from every app.",
    whyDangerous:
      "Notification contents (including 2FA codes) can be read in real time.",
  },

  // ---- Location -------------------------------------------------------------
  {
    key: "ACCESS_FINE_LOCATION",
    androidName: "android.permission.ACCESS_FINE_LOCATION",
    label: "Precise Location",
    category: "location",
    baseRiskScore: 10,
    riskLevel: "Moderate",
    description: "Allows the app to get your exact GPS location.",
    dataAccess: "Precise latitude/longitude position.",
    whyDangerous: "Pinpoints exactly where you are at any moment.",
  },
  {
    key: "ACCESS_COARSE_LOCATION",
    androidName: "android.permission.ACCESS_COARSE_LOCATION",
    label: "Approximate Location",
    category: "location",
    baseRiskScore: 6,
    riskLevel: "Moderate",
    description: "Allows the app to get your approximate location.",
    dataAccess: "City / network-level position.",
    whyDangerous: "Still enough to track movement patterns over time.",
  },
  {
    key: "ACCESS_BACKGROUND_LOCATION",
    androidName: "android.permission.ACCESS_BACKGROUND_LOCATION",
    label: "Background Location",
    category: "location",
    baseRiskScore: 20,
    riskLevel: "Critical",
    description: "Allows the app to access location even when not in use.",
    dataAccess: "Continuous location, 24/7, in the background.",
    whyDangerous: "Enables persistent, covert tracking and stalking.",
  },

  // ---- Device control / High-risk ------------------------------------------
  {
    key: "SYSTEM_ALERT_WINDOW",
    androidName: "android.permission.SYSTEM_ALERT_WINDOW",
    label: "Draw Over Other Apps",
    category: "device-control",
    baseRiskScore: 18,
    riskLevel: "High",
    description: "Allows the app to display on top of other apps.",
    dataAccess: "Overlay any screen with its own UI.",
    whyDangerous:
      "Used in overlay attacks to fake login screens and steal credentials.",
  },
  {
    key: "BIND_ACCESSIBILITY_SERVICE",
    androidName: "android.permission.BIND_ACCESSIBILITY_SERVICE",
    label: "Accessibility Service",
    category: "device-control",
    baseRiskScore: 25,
    riskLevel: "Critical",
    description: "Allows the app to observe and control the entire interface.",
    dataAccess: "Read on-screen text, simulate taps, capture every input.",
    whyDangerous:
      "The most abused permission — can read everything and act as you.",
  },
  {
    key: "DEVICE_ADMIN",
    androidName: "android.permission.BIND_DEVICE_ADMIN",
    label: "Device Admin",
    category: "device-control",
    baseRiskScore: 25,
    riskLevel: "Critical",
    description: "Grants administrative control over the device.",
    dataAccess: "Lock, wipe, change password and resist uninstallation.",
    whyDangerous:
      "Malware uses it to lock you out, wipe data, or prevent removal.",
  },
  {
    key: "REQUEST_INSTALL_PACKAGES",
    androidName: "android.permission.REQUEST_INSTALL_PACKAGES",
    label: "Install Packages",
    category: "device-control",
    baseRiskScore: 20,
    riskLevel: "Critical",
    description: "Allows the app to install other apps.",
    dataAccess: "Ability to push additional software onto the device.",
    whyDangerous: "Can silently install further malware (a dropper).",
  },
  {
    key: "PACKAGE_USAGE_STATS",
    androidName: "android.permission.PACKAGE_USAGE_STATS",
    label: "Usage Access",
    category: "device-control",
    baseRiskScore: 12,
    riskLevel: "High",
    description: "Allows the app to see which apps you use and when.",
    dataAccess: "App usage history and foreground activity.",
    whyDangerous: "Builds a detailed behavioural profile of your habits.",
  },

  // ---- General --------------------------------------------------------------
  {
    key: "INTERNET",
    androidName: "android.permission.INTERNET",
    label: "Internet Access",
    category: "general",
    baseRiskScore: 2,
    riskLevel: "Low",
    description: "Allows the app to access the internet.",
    dataAccess: "Network connectivity.",
    whyDangerous:
      "Harmless alone, but required to exfiltrate any data the app collects.",
  },
  {
    key: "POST_NOTIFICATIONS",
    androidName: "android.permission.POST_NOTIFICATIONS",
    label: "Post Notifications",
    category: "general",
    baseRiskScore: 2,
    riskLevel: "Low",
    description: "Allows the app to show notifications.",
    dataAccess: "Notification tray.",
    whyDangerous: "Mostly benign; can be used for notification spam.",
  },
  {
    key: "FOREGROUND_SERVICE",
    androidName: "android.permission.FOREGROUND_SERVICE",
    label: "Foreground Service",
    category: "general",
    baseRiskScore: 3,
    riskLevel: "Low",
    description: "Allows the app to keep running in the foreground.",
    dataAccess: "Persistent background execution.",
    whyDangerous: "Helps other risky permissions run continuously.",
  },
  {
    key: "BLUETOOTH",
    androidName: "android.permission.BLUETOOTH",
    label: "Bluetooth",
    category: "general",
    baseRiskScore: 3,
    riskLevel: "Low",
    description: "Allows the app to connect to Bluetooth devices.",
    dataAccess: "Nearby Bluetooth devices.",
    whyDangerous: "Can be used for proximity tracking via nearby beacons.",
  },
  {
    key: "VIBRATE",
    androidName: "android.permission.VIBRATE",
    label: "Vibrate",
    category: "general",
    baseRiskScore: 0,
    riskLevel: "Low",
    description: "Allows the app to control device vibration.",
    dataAccess: "None.",
    whyDangerous: "No privacy risk.",
  },
];

// -----------------------------------------------------------------------------
// Lookup helpers
// -----------------------------------------------------------------------------
const BY_KEY = new Map(PERMISSIONS.map((p) => [p.key, p]));

/** Aliases map alternative spellings/names to the canonical key. */
const ALIASES: Record<string, string> = {
  BIND_NOTIFICATION_LISTENER_SERVICE: "NOTIFICATION_ACCESS",
  NOTIFICATION_LISTENER: "NOTIFICATION_ACCESS",
  BIND_DEVICE_ADMIN: "DEVICE_ADMIN",
  DEVICE_POLICY_MANAGER: "DEVICE_ADMIN",
  READ_CLIPBOARD_DATA: "READ_CLIPBOARD",
  CLIPBOARD: "READ_CLIPBOARD",
  MEDIA_PROJECTION: "SCREEN_CAPTURE",
};

export function getPermission(key: string): PermissionDef | undefined {
  return BY_KEY.get(key);
}

/**
 * Normalize a single raw token into a canonical permission key, or null if it
 * is not a permission we support. Handles:
 *   - android.permission.READ_SMS
 *   - permission.READ_SMS / READ_SMS
 *   - lower/upper case and surrounding noise (quotes, tags, commas)
 */
export function normalizeToken(raw: string): string | null {
  if (!raw) return null;
  // Pull the permission-looking token out of noisy manifest lines.
  const match = raw.match(/([a-zA-Z0-9_.]+permission\.[A-Z_]+)|([A-Z_]{3,})/);
  let token = match ? match[0] : raw;
  token = token.trim().toUpperCase();
  // Strip any package prefix, keep the final segment.
  if (token.includes(".")) {
    token = token.split(".").pop() as string;
  }
  if (BY_KEY.has(token)) return token;
  if (ALIASES[token]) return ALIASES[token];
  return null;
}

/**
 * Parse arbitrary pasted text (manifest, permission list, settings copy) into a
 * de-duplicated list of canonical permission keys, plus the lines we ignored.
 */
export function parsePermissionInput(input: string): {
  recognized: string[];
  ignored: string[];
} {
  const recognized = new Set<string>();
  const ignored: string[] = [];
  const lines = input
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const key = normalizeToken(line);
    if (key) {
      recognized.add(key);
    } else {
      ignored.push(line);
    }
  }
  return { recognized: [...recognized], ignored };
}
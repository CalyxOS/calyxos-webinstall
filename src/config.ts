export interface ReleaseVariant {
  description: string
  suffix: string
}

export interface Config {
  OS_NAME: string
  ACCENT_COLOR: string
  RELEASE_VARIANTS: Record<string, ReleaseVariant>
}

const config: Config = {
  OS_NAME: import.meta.env.VITE_APP_OS_NAME,
  ACCENT_COLOR: "#0366d6",
  RELEASE_VARIANTS: {
    minimal: {
      description: "Minimal version without Google apps or services.",
      suffix: "",
    },
    gapps: {
      description:
        "Version with Google services included, so the apps you’re familiar with will work. Recommended for most users.",
      suffix: " with Google services",
    },
    test: {
      description: "Experimental version for testing only.",
      suffix: "experimental",
    },
    beta: {
      description: "Beta version for testing only.",
      suffix: "beta",
    },
  },
}

export default config

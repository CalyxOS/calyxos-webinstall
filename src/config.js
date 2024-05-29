export default {
    OS_NAME: process.env.VUE_APP_OS_NAME,
    ACCENT_COLOR: "#0366d6",
    SUPPORTED_DEVICES: [
        {
            name: "Pixel 3",
            model: "blueline",
        },
        {
            name: "Pixel 3 XL",
            model: "crosshatch",
        },
        {
            name: "Pixel 3a",
            model: "sargo",
        },
        {
            name: "Pixel 3a XL",
            model: "bonito",
        },
        {
            name: "Pixel 4",
            model: "flame",
        },
        {
            name: "Pixel 4 XL",
            model: "coral",
        },
        {
            name: "Pixel 4a",
            model: "sunfish",
        },
        {
            name: "Pixel 5",
            model: "redfin",
        },
        {
            name: "Pixel 4a (5G)",
            model: "bramble",
        },
        {
            name: "Pixel 5a (5G)",
            model: "barbet",
        },
        {
            name: "Pixel 6",
            model: "oriole",
        },
        {
            name: "Pixel 6 Pro",
            model: "raven",
        },
        {
            name: "Pixel 6a",
            model: "bluejay",
        },
        {
            name: "Pixel 7",
            model: "panther",
        },
        {
            name: "Pixel 7 Pro",
            model: "cheetah",
        },
        {
            name: "Fairphone 4",
            model: "FP4",
        },
    ],
    RELEASE_VARIANTS: {
        factory: {
            description: "Stable release.",
            suffix: "",
        },
    },
    DONATION_LINKS: [
        {
            title: "Make a Tax-deductible Donation to Calyx Institute",
            description:
                "You can donate through paypal, cryptocurrency, or by mail.",
            highlight: false,
            url: "https://members.calyxinstitute.org/donate",
            icon: "",
        },
    ],
};

import config from "../config";

const DEVICE_NAMES = config.SUPPORTED_DEVICES.reduce(function (obj, device) {
    obj[device.model] = device.name;
    return obj;
}, {});

export function getDeviceName(device) {
    return device in DEVICE_NAMES ? DEVICE_NAMES[device] : device;
}

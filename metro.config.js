const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add PDF to asset extensions so Metro can bundle PDF files
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'pdf'];

module.exports = withNativeWind(config, { input: "./global.css" });

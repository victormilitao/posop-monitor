module.exports = function (api) {
    api.cache(true);

    const isTest = process.env.JEST_WORKER_ID !== undefined;

    const presets = [
        ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ];

    // NativeWind's babel plugin injects variables that break jest.mock() scope
    if (!isTest) {
        presets.push("nativewind/babel");
    }

    return {
        presets,
    };
};

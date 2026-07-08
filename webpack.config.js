export default{
    entry: {
        main : "./emulator/emulatorStandalone.ts"
    },
    module : {
        rules : [
            {
                test: /\.[jt]sx?$/,
                loader: 'esbuild-loader',
                options: { target: 'es2015'}
            }
        ]
    },
    resolve: {
      extensions: ['.ts', '.js']
   },
};
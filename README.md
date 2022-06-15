# [Experimental] coc-volar-alpinejs

> fork from [vscode-alpine-language-features](https://github.com/johnsoncodehk/volar/tree/master/extensions/vscode-alpine-language-features)

[Alpine Language Features](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.alpine-language-features) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Note

`@volar/alpine-language-server` is a Language Server separated out of `@volar/vue-language-server`  and currently not yet optimized for Alpine.js. (e.g. `x-` directive completion, etc. will not work)

## Usage

[WARNING] This extension will not work with the default settings. 

1. To use it, add the `"volar.alpine.enable: true"` setting to your project's `.vim/coc-settings.json`. Project-level `coc-settings.json` can be quickly created by running the `:CocLocalConfig` command.

**.vim/coc-settings.json**:

```jsonc
{
  "volar.alpine.enable": true,
}
```

2. Create `jsconfig.json` or `tsconfig.json` to your Alpine project, and than adding below content.

**jsconfig.json/tsconfig.json**:

```jsonc
{
	"compilerOptions": {
		"allowJs": true,
		"jsx": "preserve"
	},
	"include": [
		"PATH_TO_THE_HTML_FILES/**/*.html"
	]
}
```

3. (Optional) Install `@vue/runtime-dom` to devDependencies for support html element typs.

## Thanks

- [johnsoncodehk/volar](https://github.com/johnsoncodehk/volar)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

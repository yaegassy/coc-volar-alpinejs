# [Experimental] coc-volar-alpinejs

> fork from [vscode-alpine-language-features](https://github.com/johnsoncodehk/volar/tree/master/extensions/vscode-alpine-language-features)

[Alpine Language Features](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.alpine-language-features) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Note

`@volar/alpine-language-server` is a Language Server separated out of `@volar/vue-language-server`  and currently not yet optimized for Alpine.js. (e.g. `x-` directive completion, etc. will not work)

## Usage

#. Create `jsconfig.json` or `tsconfig.json` to your Alpine project, and than adding below content.

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

#. (Optional) Install `@vue/runtime-dom` to devDependencies for support html element typs.

## Thanks

- [johnsoncodehk/volar](https://github.com/johnsoncodehk/volar)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

# Run

```
rm -rf build && npx @11ty/eleventy --serve --port 8888
```

# Dev Tips

* Eg `index` template uses `default` template, then if some page uses `index` template, changes in `default` are not applied automatically. To achieve rebuild with new data you have to initiate a save action for `index` template (just press `Cmd/Ctrl + S`).

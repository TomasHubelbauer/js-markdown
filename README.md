# JavaScript MarkDown

[**WEB**](https://tomashubelbauer.github.io/js-markdown)

A JavaScript library for parsing and serializing MarkDown AST/DOM.

This library is a **work in progress!**
This readme also serves as a test document.

> It is a work in progress.
> 
> Tomas Hubelbauer

## Running

`npx serve .`

## To-Do

### Implement continuing quote blocks without the subsequent block markers

```md
> quote
still quote

not quote
```

### Implement parsing inline code spans

### Implement parsing fenced code blocks

### Store cursor position on the block and span objects

This way altering a document can be made by either parsing it, altering it and
the serializing it or by parsing it and patching it at the desired position.

### Select the block/span region in the text area when hovered over in the list

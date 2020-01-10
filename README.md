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

### Implement parsing fenced code blocks

### Store cursor position on the block and span objects

This way altering a document can be made by either parsing it, altering it and
the serializing it or by parsing it and patching it at the desired position.

### Select the block/span region in the text area when hovered over in the list

### Implement parsing italic nested in bold and bold nested in italic

Probably need to generalize the bold and italic functions into one which takes
the special character as a parameter?

If we make the functions in `syntax` parametric, it will break equality checks
in `nameSyntax`, so we need to create a fallback for that.
The simplest might be just setting `name` on the resulting function, or setting
a symbol or something on it and the generator function which will be used to
determine if the generated function came from the generator function at the
current key of the `syntax` object being scanned in `nameSyntax`.

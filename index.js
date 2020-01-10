window.addEventListener('load', async () => {
  const tests = {
    '': [{ spans: [] }],
    'Hello.': [{ spans: [{ text: 'Hello.' }] }],
    '#NotHeader': [{ spans: [{ text: '#NotHeader' }] }],
    '# Header': [{ type: 'header', level: 1, spans: [{ text: 'Header' }] }],
    '> quote\nstill quote\n\nnot quote': [{ type: 'quote', spans: [{ text: ' quote still quote' }] }, { spans: [{ text: 'not quote' }] }],
  };

  for (const test in tests) {
    console.groupCollapsed(JSON.stringify(test));
    const result = new Markdown(test, console.log).blocks;
    console.groupEnd();
    if (JSON.stringify(result) !== JSON.stringify(tests[test])) {
      console.log(JSON.stringify(tests[test], null, 2));
      console.log(JSON.stringify(result, null, 2));
      throw new Error('Test failed!');
    }
  }

  const sourceTextArea = document.getElementById('sourceTextArea');
  const astDiv = document.getElementById('astDiv');
  sourceTextArea.addEventListener('input', () => {
    const markdown = new Markdown(sourceTextArea.value);
    astDiv.innerHTML = '';
    for (const block of markdown.blocks) {
      const { spans, ...rest } = block;
      const blockDetails = document.createElement('details');
      blockDetails.open = true;
      const blockSummary = document.createElement('summary');
      blockSummary.textContent = JSON.stringify(rest);
      blockDetails.append(blockSummary);
      const spansUl = document.createElement('ul');
      for (const span of spans) {
        const spanLi = document.createElement('li');
        spanLi.textContent = JSON.stringify(span);
        spansUl.append(spanLi);
      }

      astDiv.append(blockDetails, spansUl);
    }
  });

  if (!sourceTextArea.value) {
    const response = await fetch('README.md');
    sourceTextArea.value = await response.text();
  }

  // Load the prefilled text restored by the browser on reload
  sourceTextArea.dispatchEvent(new Event('input'));
});

class Markdown {
  constructor(source, onStep) {
    // Respect the conventional order of fields: [undefined], *, fallback, default
    // Note that in order to add a debugger to the parentheses, use this
    // `void function () { debugger }()` to make the debugger statement and expression
    let syntax = {
      block: {
        '#': {
          ' ': self => (addHeaderBlock(1), self.span),
          '#': {
            ' ': self => (addHeaderBlock(2), self.span),
            default: self => (appendTextSpan('##'), self.span),
          },
          default: self => (appendTextSpan('#'), self.span),
        },
        '>': self => (addQuoteBlock(), self.span),
        default: self => (reuseBlock(), self.span),
      },
      span: self => self.textSpan,
      textSpan: {
        [undefined]: self => (endTextSpan(), undefined),
        '\n': {
          '\n': self => (addBlock(), span = undefined, self.block),
          default: self => (endTextSpan(), self.block)
        },
        fallback: (self, token) => (appendTextSpan(token), self.textSpan)
      },
      default: self => self.block
    };

    let _syntax = syntax;
    const blocks = [];
    let block;
    let span;

    function reuseBlock() {
      // Reuse multiline block
      if (blocks[blocks.length - 1] && blocks[blocks.length - 1].type !== 'header') {
        return;
      }

      addBlock();
    }

    function addBlock() {
      block = { spans: [] };
      blocks.push(block);
    }

    function addHeaderBlock(level) {
      block = { type: 'header', level, spans: [] };
      blocks.push(block);
    }

    function addQuoteBlock() {
      block = { type: 'quote', spans: [] };
      blocks.push(block);
    }

    function appendTextSpan(token) {
      if (!span) {
        // Revive the last text span after a line break
        if (block && block.spans[block.spans.length - 1]) {
          span = block.spans[block.spans.length - 1];
          span.text += ' ';
        }
        else {
          span = { text: '' };
          if (!block) {
            addBlock();
          }

          block.spans.push(span);
        }
      }

      span.text += token;
    }

    function endTextSpan() {
      span = undefined;

      // End non-multiline block
      if (block.type === 'header') {
        block = undefined;
      }
    }

    function nameSyntax(syntax) {
      if (syntax === _syntax) {
        return '/';
      }

      const paths = [{ path: '/', syntax: _syntax }];
      do {
        const path = paths.shift();
        for (const name in path.syntax) {
          if (path.syntax[name] === syntax) {
            return JSON.stringify(path.path + name);
          }

          paths.push({ path: path.path + name + '/', syntax: path.syntax[name] });
        }
      } while (paths.length > 0);

      throw new Error('Syntax name not found!');
    }

    let cursor = 0;
    while (cursor <= source.length) {
      const token = source[cursor];
      if (syntax === undefined) {
        throw new Error('Continuation past the end of source!');
      }

      if (onStep) {
        onStep(cursor, nameSyntax(syntax), JSON.stringify(token));
      }

      if (syntax[token]) {
        syntax = syntax[token];
        cursor++;
      }
      else if (syntax.fallback) {
        syntax = syntax.fallback(_syntax, token);
        cursor++;
      }
      else if (syntax.default) {
        syntax = syntax.default(_syntax);
      }
      else {
        throw new Error(`Error at cursor ${cursor}, syntax ${nameSyntax(syntax)}`);
      }

      // Resolve a chain of methods to the final object
      while (typeof syntax === 'function') {
        syntax = syntax(_syntax);
      }
    }

    this.blocks = blocks;
  }
}

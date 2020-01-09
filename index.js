window.addEventListener('load', async () => {
  const tests = {
    'Hello.': [{ spans: [{ text: 'Hello.' }] }],
    '#NotHeader': [{ spans: [{ text: '#NotHeader' }] }],
    '# Header': [{ type: 'header', level: 1, spans: [{ text: 'Header' }] }]
  };

  for (const test in tests) {
    const result = new Markdown(test, true).blocks;
    if (JSON.stringify(result) !== JSON.stringify(tests[test])) {
      console.log(JSON.stringify(tests[test], null, 2));
      console.log(JSON.stringify(result, null, 2));
      throw new Error('Test failed:\n' + test);
    }
    else {
      console.log('Test passed.');
    }
  }

  const sourceTextArea = document.getElementById('sourceTextArea');
  const astPre = document.getElementById('astPre');
  sourceTextArea.addEventListener('input', () => {
    astPre.textContent = JSON.stringify(new Markdown(sourceTextArea.value), null, 2);
  });

  if (!sourceTextArea.value) {
    const response = await fetch('README.md');
    sourceTextArea.value = await response.text();
  }

  // Load the prefilled text restored by the browser on reload
  sourceTextArea.dispatchEvent(new Event('input'));
});

class Markdown {
  constructor(source, test) {
    // Respect the conventional order of fields: [undefined], *, fallback, default.
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
        default: self => (addBlock(), self.span),
      },
      span: self => self.textSpan,
      textSpan: {
        [undefined]: self => (endTextSpan(), self.end),
        '\n': self => (endTextSpan(), self.block),
        fallback: (self, token) => (appendTextSpan(token), self.textSpan)
      },
      default: self => self.block,
      end: (self, token) => { /* EOF */ }
    };

    const blocks = [];
    let block;
    let span;

    function addBlock() {
      block = { spans: [] };
      blocks.push(block);
    }

    function addHeaderBlock(level) {
      block = { type: 'header', level, spans: [] };
      blocks.push(block);
    }

    function appendTextSpan(token) {
      if (!span) {
        // Revive the last text span after a line break
        if (block && block.spans[block.spans.length - 1] && block.spans[block.spans.length - 1].type === 'text') {
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

      // End non-plain block
      if (block.type) {
        block = undefined;
      }
    }

    let cursor = 0;
    let _syntax = syntax;
    while (cursor <= source.length) {
      const token = source[cursor];
      if (!test) {
        console.log(cursor, JSON.stringify(token), syntax);
      }

      let branch = syntax[token];
      if (branch) {
        syntax = branch;
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
        throw new Error(`Error at cursor ${cursor}, syntax ${JSON.stringify(syntax)}`);
      }

      // Resolve a chain of methods to the final object
      while (typeof syntax === 'function') {
        syntax = syntax(_syntax);
      }
    }

    this.blocks = blocks;
  }
}

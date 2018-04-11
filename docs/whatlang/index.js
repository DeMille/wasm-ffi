const $ = sel => document.querySelector(sel);
const textarea = $('textarea');

const DetectResult = new ffi.Struct({
  lang: ffi.rust.string,
  confidence: 'f64',
  is_reliable: 'bool',
});

const whatlang = new ffi.Wrapper({
  detect: [DetectResult, ['string']],
});

whatlang.fetch('whatlang.webasm').then(() => {
  function update(str) {
    const result = whatlang.detect(str);

    $('#language').innerText = result.lang.value;
    $('#reliable').className = (result.is_reliable) ? 'yes' : 'no';

    $('#confidence').innerText = (result.confidence * 100).toFixed(1) + '%';
    $('#bar').value = result.confidence * 100;
  }

  textarea.addEventListener('input', () => update(textarea.value));

  [...document.querySelectorAll('#languages .btn')].forEach(el =>
    el.addEventListener('click', () => {
      textarea.value = el.nextElementSibling.innerHTML.trim();
      update(textarea.value);
    }));
});

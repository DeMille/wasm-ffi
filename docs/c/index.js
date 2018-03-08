// ghetto jquery
const $ = sel => document.querySelector(sel);

const Person = new ffi.Struct({
  name: 'string',
  age: 'uint8',
  favorite_number: 'uint32',
});

const library = new ffi.Wrapper({
  say: ['string', ['string']],

  get_sum: ['number', ['array', 'number']],

  get_pointer: [ffi.types.pointer('uint32')],
  pass_pointer: ['number', [ffi.types.pointer('uint32')]],

  get_person: [Person],
  person_facts: ['string', [Person]],

  barrel_roll: [],
  multiply_input: ['number', ['string']],
});

library.imports(wrap => ({
  env: {
    memory: new WebAssembly.Memory({ initial: 10 }),

    rotate: function() {
      $('body').classList.toggle('rotate');
    },

    get_input_value: wrap(['number', ['string']], (selector) => {
      return parseInt($(selector).value);
    }),
  },
}));

library.fetch('main.wasm').then(() => {

  $('#say-hello').addEventListener('click', () => {
    alert(library.say('Hello'));
  });

  $('#get-sum').addEventListener('click', () => {
    const arr = new Uint32Array([1, 1, 2, 3, 5, 8, 13, 21]);
    const sum = library.get_sum(arr, arr.length);

    $('#sum-log').innerText = `Sum of ${arr} is: ${sum}`;
  });

  $('#get-pointer').addEventListener('click', () => {
    const ptr = library.get_pointer();
    $('#pointer-log').innerText = `Value ${ptr.deref()} is located @ ${ptr.ref()}`;
  });

  $('#pass-pointer').addEventListener('click', () => {
    const ptr = new ffi.Pointer('uint32', 365);
    const value = library.pass_pointer(ptr);

    $('#pointer-log').innerText = `Wasm read ${value} from the pointer you sent`;
  });

  $('#get-person').addEventListener('click', () => {
    const p = library.get_person();

    const about = `${p.name} is ${p.age}. His favorite number is ${p.favorite_number}.`;
    $('#person-log').innerText = about;
  });

  $('#modify-person').addEventListener('click', () => {
    const p = library.get_person();
    p.age = 255;
    p.favorite_number = 100;

    $('#person-log').innerText = `New age: ${p.age}\n`;
    $('#person-log').innerText += `New favorite: ${p.favorite_number}\n`;
    $('#person-log').innerText += library.person_facts(p);
  });

  $('#make-person').addEventListener('click', () => {
    const name = $('#name').value;
    const age = parseInt($('#age').value);
    const num = parseInt($('#num').value);

    const person = new Person({
      name: name,
      age: age,
      favorite_number: num,
    });

    $('#make-log').innerText = library.person_facts(person);
  });

  $('#barrel-roll').addEventListener('click', () => {
    library.barrel_roll();
  });

  $('#multiply').addEventListener('click', () => {
    const number = library.multiply_input('input#number');

    $('#multiply-log').innerText = `Result: ${number}`;
  });

});

import 'allocator/buddy';

declare function rotate(): void;
declare function get_input_value(msg: string): u32;

export function allocate(size: usize): usize {
    return allocate_memory(size);
}

export function deallocate(ptr: usize): void {
    free_memory(ptr);
}

export function say(hello: string): string {
    return hello + ', World!';
}

export function get_sum(arr: u32[]): usize {
    let result = 0;

    for (let i = 0; i < arr.length; i++) {
        result += arr[i];
    }

    free_memory(changetype<usize>(arr));

    return result;
}

export function get_pointer(): usize {
    let value: u32 = 333;
    let ptr = allocate_memory(4);

    store<u32>(ptr, value);

    return ptr;
}

export function pass_pointer(ptr: usize): u32 {
    return load<u32>(ptr);
}

class Person {
    name: 'string';
    age: u8;
    favorite_number: u32;

    constructor(name: string, age: u8, favorite_number: u32) {
        this.name = name;
        this.age = age;
        this.favorite_number = favorite_number;
    }
}

export function get_person(): Person {
    return new Person('Jean-Luc Picard', 61, 1701);
}

export function person_facts(p: Person): string {
    return (p.age > p.favorite_number)
        ? p.name + ' is older than his favorite_number'
        : p.name + ' is younger than his favorite_number';
}

export function barrel_roll(): void {
    rotate();
}

export function multiply_input(dom_selector: 'string'): u32 {
    return get_input_value(dom_selector) * 2;
}

// export function return_foo_array(): Foo[] {
//     let a = new Foo(1, 2, 3);
//     let b = new Foo(4, 5, 6);

//     let arr: Foo[] = [];
//     arr.push(a);
//     arr.push(b);

//     return arr;
// }

// export function give_string_array(arr: string[]): usize {
//     let result = 0;

//     for (let i = 0; i < arr.length; i++) {
//         result += arr[i].length;
//     }

//     return result;
// }

import 'allocator/buddy';

declare function print(msg: string, n?: number): void;

export function allocate(size: usize): usize {
    return allocate_memory(size);
}

export function deallocate(ptr: usize): void {
    free_memory(ptr);
}

export function return_string(count: usize): string {
    return 'na '.repeat(count) + 'batman!';
}

export function strings_match(a: string, b: string): boolean {
    return a == b;
}

class Foo {
    a: u32;
    b: u8;
    c: u16;

    constructor(a: u32, b: u8, c: u16) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    add(): usize {
        return this.a + this.b + this.c;
    }
}

export function make_foo(): Foo {
    return new Foo(1111, 222, 3333);
}

export function foo_add(foo: Foo): usize {
    let result = foo.add();
    free_memory(changetype<usize>(foo));

    return result;
}

export function sum_array(arr: u8[]): usize {
    let result = 0;

    for (let i = 0; i < arr.length; i++) {
        result += arr[i];
    }

    free_memory(changetype<usize>(arr));

    return result;
}

export function sum_f32_array(arr: f32[]): f32 {
    let result: f32 = 0.0;

    for (let i = 0; i < arr.length; i++) {
        result += arr[i];
    }

    free_memory(changetype<usize>(arr));

    return result;
}

export function return_array(len: usize): u32[] {
    let arr: u32[] = [];

    for (let i: u32 = 0; i < len; i++) {
        arr.push(i);
    }

    return arr;
}

export function return_foo_array(): Foo[] {
    let a = new Foo(1, 2, 3);
    let b = new Foo(4, 5, 6);

    let arr: Foo[] = [];
    arr.push(a);
    arr.push(b);

    return arr;
}

export function give_string_array(arr: string[]): usize {
    let result = 0;

    for (let i = 0; i < arr.length; i++) {
        result += arr[i].length;
    }

    return result;
}

export function throw_error(): void {
    throw new Error();
}
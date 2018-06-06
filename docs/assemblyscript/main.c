#include <webassembly.h>

// macro used to export functions to WebAssembly
export int add(int a, int b) {
  return a + b;
}

// allocate/deallocate exports are exactly what you would expect:
export void *allocate(int size) {
  return malloc(size);
}

export void deallocate(void *ptr) {
  free(ptr);
}

export char *say(char *hello) {
  char *phrase = calloc(strlen(hello) + 9, 1);
  strcat(phrase, hello);
  strcat(phrase, ", World!");

  return phrase;
}

export int get_sum(int arr[], size_t length) {
  int i;
  int sum = 0;

  for (i = 0; i < length; ++i) {
    sum += arr[i];
  }

  return sum;
}

export int *get_pointer() {
  int *ptr = malloc(sizeof *ptr);
  *ptr = 123;

  return ptr;
}

export int pass_pointer(int *ptr) {
  return *ptr;
}

struct Person {
  char *name;
  uint8_t age;
  uint32_t favorite_number;
};

export struct Person *get_person() {
  struct Person *p = malloc(sizeof(struct Person));
  p->name = "Jean-Luc Picard";
  p->age = 61;
  p->favorite_number = 1701;

  return p;
}

export char *person_facts(struct Person *p) {
  char *about = calloc(strlen(p->name) + 40, 1);
  strcat(about, p->name);

  if (p->age > p->favorite_number) {
    strcat(about, " is older than his favorite number.");
  } else {
    strcat(about, " is younger than his favorite number.");
  }

  return about;
}

extern void rotate();
extern int get_input_value(char *);

export void barrel_roll() {
  rotate();
}

export int multiply_input(char *dom_selector) {
  return get_input_value(dom_selector) * 2;
}

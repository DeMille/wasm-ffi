#include <webassembly.h>

export void *allocate(int size) { return malloc(size); }

export void deallocate(void *ptr) { free(ptr); }

struct PlainStruct {
  char a;
  int b;
  short c;
};

export struct PlainStruct *return_plain_struct() {
  struct PlainStruct *pt = malloc(sizeof(struct PlainStruct));
  pt->a = 1;
  pt->b = 2;
  pt->c = 3;

  return pt;
}

export int give_plain_struct(struct PlainStruct *pt) { return pt->b; }

export char *return_string() {
  char *str = "passed string";
  return str;
}

export bool strings_match(char *a, char *b) {
  return (strcmp(a, b) == 0);
}

export char sum_u8_array(const char arr[], size_t length) {
  int i;
  char sum = 0;

  for (i = 0; i < length; ++i) {
    sum += arr[i];
  }

  return sum;
}

export int sum_u32_array(const int arr[], size_t length) {
  int i;
  int sum = 0;

  for (i = 0; i < length; ++i) {
    sum += arr[i];
  }

  return sum;
}

extern void callback(int num);
export void trigger_callback() { callback(777); }

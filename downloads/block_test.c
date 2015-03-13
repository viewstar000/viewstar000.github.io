//
//  block_test.c
//  pysys
//
//  Created by lili01 on 15/3/10.
//
//

#include <stdio.h>
#include <stdlib.h>
#include <time.h>



struct Item{
    int     doc_id;
    float   weight;
};

typedef struct Item BufferItem;
typedef struct Item * Buffer;

void buffer_init(Buffer buf, int lenght){
    for (int i=0; i<lenght; i++) {
        buf[i].doc_id = rand();
        buf[i].weight = (float)rand();
    }
}

void buffer_sort(Buffer buf, int lenght){
    printf("---------------------------------------\n");
    clock_t st = clock();
    //printf("%ld\n", st);
    for (int head_off = 0; head_off < lenght; head_off++) {
        int min_off = head_off;
        for (int cur_off = head_off; cur_off < lenght; cur_off++) {
            if (buf[cur_off].weight < buf[min_off].weight) {
                min_off = cur_off;
            }
        }
        if (min_off != head_off) {
            BufferItem t = buf[head_off];
            buf[head_off] = buf[min_off];
            buf[min_off] = t;
        }
    }
    clock_t et = clock();
    //printf("%ld\n", et);
    clock_t ut = et - st;
    float fut = (float)ut / (float)CLOCKS_PER_SEC;
    printf("%f\n", fut);
    printf("---------------------------------------\n");
    
}

int main(){
    int lenght = 1024 * 4;
    Buffer buffer = malloc(sizeof(BufferItem) * lenght);
    buffer_init(buffer, lenght);
    buffer_sort(buffer, lenght);
    return 0;
}

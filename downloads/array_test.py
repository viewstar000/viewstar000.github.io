#! /usr/bin/env python
#coding=utf-8
import sys
import struct
import array
import time
import random


BUFFER_LENGTH = 1024 * 4

TEST_MODE = sys.argv[1]

if TEST_MODE == "BUILTIN_LIST":

    ITEM_SIZE = 2

    def get_item(buf, off):

        return buf[off]
        
    def set_item(buf, off, value):

        buf[off] = value

    buf = [0] * ITEM_SIZE * BUFFER_LENGTH

elif TEST_MODE == "INT_ARRAY":

    ITEM_SIZE = 2

    def get_item(buf, off):

        return buf[off]
        
    def set_item(buf, off, value):

        buf[off] = value

    buf = array.array('i', [0] * BUFFER_LENGTH * ITEM_SIZE)

elif TEST_MODE == "BYTE_ARRAY_WITH_STRUCT":

    ITEM_SIZE = 4 * 2
    PACKER = struct.Struct("ii")

    def get_item(buf, off):

        return PACKER.unpack_from(buf, off)[0]
        
    def set_item(buf, off, value):

        PACKER.pack_into(buf, off, value, 0)
    
    buf = array.array('b', [0] * BUFFER_LENGTH * ITEM_SIZE)

elif TEST_MODE == "BYTE_ARRAY_WITH_C":
    
    import _buffer_proxy

    ITEM_SIZE = 4 * 2
    
    def get_item(buf, off):

        return _buffer_proxy.get_value(buf, off)
        
    def set_item(buf, off, value):

        _buffer_proxy.set_value(buf, off, value)

    buf = array.array('b', [0] * BUFFER_LENGTH * ITEM_SIZE)

elif TEST_MODE == "CFFI":

    ITEM_SIZE = 1

    def get_item(buf, off):

        return buf[off].doc_id

    def set_item(buf, off, value):

        buf[off].doc_id = value
        buf[off].weight = 0

    from cffi import FFI
    ffi = FFI()
    ffi.cdef("""
        typedef struct {
            int doc_id;
            float weight;
        } rindex_item_t;
    """)

    buf = ffi.new("rindex_item_t[]", BUFFER_LENGTH)


def prepare_buffer():
    
    for i  in xrange(0, len(buf) , ITEM_SIZE):    
        set_item(buf, i, random.randint(0, 2**30))
    return buf


def sort(buf):
    
    print ('---------------------------------------------------------')
    st = time.time()
    for head_off  in xrange(0, len(buf) , ITEM_SIZE):
        min_off     = head_off
        min_value   = get_item(buf, min_off)
        for cur_off in xrange(head_off + ITEM_SIZE, len(buf) , ITEM_SIZE):
            cur_value = get_item(buf, cur_off)
            if cur_value < min_value:
                min_off     = cur_off
                min_value   = cur_value
        if head_off != min_off:
            set_item(buf, min_off, get_item(buf, head_off))
            set_item(buf, head_off, min_value);
    print (time.time() - st)
    print ('---------------------------------------------------------')

if __name__ == '__main__':
    
    buf = prepare_buffer()
    sort(buf)
    

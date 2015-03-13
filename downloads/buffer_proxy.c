//
//  buffer_proxy.c
//  pysys
//
//  Created by lili01 on 15/3/5.
//
//

#include "buffer_proxy.h"

static PyObject *
buffer_set_value(PyObject *self, PyObject *args)
{
    char *  buffer      = NULL;
    int     buffer_size = 0;
    int     offset      = 0;
    int     value       = 0;
    
    if (!PyArg_ParseTuple(args, "w#ii", &buffer, &buffer_size, &offset, &value))
        return NULL;
    *((int*)(buffer + offset)) = value;
    return Py_BuildValue("");
}

static PyObject *
buffer_get_value(PyObject *self, PyObject *args)
{
    char *  buffer      = NULL;
    int     buffer_size = 0;
    int     offset      = 0;
    int *   value       = NULL;
    if (!PyArg_ParseTuple(args, "w#i", &buffer, &buffer_size, &offset))
        return NULL;
    value = (int*)(buffer + offset);
    return Py_BuildValue("i", *value);
}

//static PyObject *
//buffer_cmp_1(PyObject *self, PyObject *args)
//{
//    char *  buffer_1        = NULL;
//    int     buffer_1_size   = 0;
//    int     offset_1        = 0;
//    int     a               = 0;
//    int     b               = 0;
//    int     result          = 0;
//    if (!PyArg_ParseTuple(args, "w#ii",
//                          &buffer_1, &buffer_1_size, &offset_1,
//                          &a))
//        return NULL;
//    a = *((int*)(buffer_1 + offset_1));
//    if (a == b)
//        result = 0;
//    else if(a<b)
//        result = -1;
//    else
//        result = 1;
//    return Py_BuildValue("i", result);
//}
//
//static PyObject *
//buffer_cmp_2(PyObject *self, PyObject *args)
//{
//    char *  buffer_1        = NULL;
//    int     buffer_1_size   = 0;
//    int     offset_1        = 0;
//    char *  buffer_2        = NULL;
//    int     buffer_2_size   = 0;
//    int     offset_2        = 0;
//    int     a               = 0;
//    int     b               = 0;
//    int     result          = 0;
//    if (!PyArg_ParseTuple(args, "w#iw#i",
//                          &buffer_1, &buffer_1_size, &offset_1,
//                          &buffer_2, &buffer_2_size, &offset_2))
//        return NULL;
//    a = *((int*)(buffer_1 + offset_1));
//    b = *((int*)(buffer_2 + offset_2));
//    if (a == b)
//        result = 0;
//    else if(a<b)
//        result = -1;
//    else
//        result = 1;
//    return Py_BuildValue("i", result);
//}
//
//static PyObject *
//buffer_swap_value(PyObject *self, PyObject *args)
//{
//    char *  buffer_1        = NULL;
//    int     buffer_1_size   = 0;
//    int     offset_1        = 0;
//    char *  buffer_2        = NULL;
//    int     buffer_2_size   = 0;
//    int     offset_2        = 0;
//    int     tmp             = 0;
//    if (!PyArg_ParseTuple(args, "w#iw#i",
//                          &buffer_1, &buffer_1_size, &offset_1,
//                          &buffer_2, &buffer_2_size, &offset_2))
//        return NULL;
//    tmp = *((int*)(buffer_1 + offset_1));
//    *((int*)(buffer_1 + offset_1)) = *((int*)(buffer_2 + offset_2));
//    *((int*)(buffer_2 + offset_2)) = tmp;
//    return Py_BuildValue("");
//}

static PyMethodDef Methods[] = {
    {"set_value",  buffer_set_value, METH_VARARGS,
        "set_value(buffer, offset, value)"},
    {"get_value",  buffer_get_value, METH_VARARGS,
        "get_value(buffer, offset) => int"},
//    {"swap_value",  buffer_swap_value, METH_VARARGS,
//        "swap_value(buffer_1, offset_1, buffer_2, offset_2)"},
//    {"cmp_1",  buffer_cmp_1, METH_VARARGS,
//        "swap_value(buffer_1, offset_1, other)"},
//    {"cmp_2",  buffer_cmp_2, METH_VARARGS,
//        "swap_value(buffer_1, offset_1, buffer_2, offset_2)"},
    {NULL, NULL, 0, NULL}        /* Sentinel */
};

PyMODINIT_FUNC
init_buffer_proxy(void)
{
    (void) Py_InitModule("_buffer_proxy", Methods);
}

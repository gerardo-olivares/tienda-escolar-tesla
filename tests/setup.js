// Variables de entorno para las pruebas (no se conecta a ninguna base de datos real)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'clave_de_prueba_para_jest_con_mas_de_32_caracteres';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/tienda_test';

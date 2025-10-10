import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CogIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input } from '@/components/ui';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: CogIcon },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'notifications', label: 'Notificaciones', icon: BellIcon },
    { id: 'security', label: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'appearance', label: 'Apariencia', icon: SwatchIcon },
  ];

  return (
    <div className="space-y-8"><div className="relative mb-8">
        <motion.h1 
          className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-cyan-600 bg-clip-text text-transparent animate-gradient"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Configuración
        </motion.h1>
        <motion.p 
          className="mt-3 text-gray-600 dark:text-gray-400 text-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Personaliza tu experiencia en el sistema
        </motion.p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6"><motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-64"
        >
          <Card variant="glass" className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </motion.div><motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1"
        >
          {activeTab === 'general' && (
            <Card variant="glass" className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Configuración General
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Organización
                  </label>
                  <Input
                    placeholder="Mi Empresa S.A."
                    defaultValue="Versiones App Corp"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Base de la API
                  </label>
                  <Input
                    placeholder="https://api.versiones.com"
                    defaultValue="http://localhost:8080/api"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zona Horaria
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600">
                    <option>America/Bogota</option>
                    <option>America/Mexico_City</option>
                    <option>America/New_York</option>
                    <option>Europe/Madrid</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="primary"
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'profile' && (
            <Card variant="glass" className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Perfil de Usuario
              </h2>
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Cambiar Foto
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      JPG, PNG hasta 2MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre
                    </label>
                    <Input placeholder="Juan" defaultValue="Usuario" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Apellido
                    </label>
                    <Input placeholder="Pérez" defaultValue="Demo" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input 
                    type="email" 
                    placeholder="juan.perez@empresa.com"
                    defaultValue="usuario@demo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cargo
                  </label>
                  <Input placeholder="Desarrollador Senior" defaultValue="Administrador del Sistema" />
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="primary"
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                  >
                    Actualizar Perfil
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card variant="glass" className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Notificaciones
              </h2>
              <div className="space-y-6">
                {[
                  { id: 'email', label: 'Notificaciones por Email', description: 'Recibir alertas por correo electrónico' },
                  { id: 'push', label: 'Notificaciones Push', description: 'Notificaciones en el navegador' },
                  { id: 'versions', label: 'Nuevas Versiones', description: 'Alertas cuando se crean nuevas versiones' },
                  { id: 'signatures', label: 'Firmas Pendientes', description: 'Recordatorios de versiones por firmar' },
                  { id: 'errors', label: 'Errores del Sistema', description: 'Notificaciones de errores críticos' }
                ].map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {notification.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {notification.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-primary-600 peer-checked:to-secondary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card variant="glass" className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Seguridad
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Cambiar Contraseña
                  </h3>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      label="Contraseña Actual"
                      placeholder="••••••••"
                    />
                    <Input
                      type="password"
                      label="Nueva Contraseña"
                      placeholder="••••••••"
                    />
                    <Input
                      type="password"
                      label="Confirmar Nueva Contraseña"
                      placeholder="••••••••"
                    />
                    <Button 
                      variant="primary"
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                    >
                      Cambiar Contraseña
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Autenticación de Dos Factores
                  </h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">2FA</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Agregar una capa extra de seguridad
                      </p>
                    </div>
                    <Button variant="outline">
                      Configurar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card variant="glass" className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Apariencia
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Tema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['light', 'dark', 'system'].map((theme) => (
                      <div
                        key={theme}
                        className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors"
                      >
                        <div className={`w-full h-20 rounded mb-3 ${
                          theme === 'light' ? 'bg-white border' :
                          theme === 'dark' ? 'bg-gray-900' :
                          'bg-gradient-to-br from-white to-gray-900'
                        }`}></div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Oscuro'}
                        </h4>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Color Primario
                  </h3>
                  <div className="flex space-x-4">
                    {[
                      { name: 'Índigo', color: 'bg-indigo-500' },
                      { name: 'Púrpura', color: 'bg-purple-500' },
                      { name: 'Cian', color: 'bg-cyan-500' },
                      { name: 'Verde', color: 'bg-green-500' },
                      { name: 'Naranja', color: 'bg-orange-500' }
                    ].map((color) => (
                      <button
                        key={color.name}
                        className={`w-10 h-10 rounded-full ${color.color} hover:scale-110 transition-transform`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
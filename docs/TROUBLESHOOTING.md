# Troubleshooting Seed y Drive

## El seed falla por timeouts o n8n caido
- **SÇntoma:** Logs muestran errores de conexiÇün a los webhooks o `ECONNREFUSED`.
- **AcciÇün:** Verifica que n8n estÇ­ corriendo y que los workflows estÇ§n **activos** antes de `npm run seed`. Si necesitas avanzar sin Drive, pon `SEED_CREATE_DRIVE_FOLDERS=false`.

## Carpetas duplicadas en Drive
- **SÇntoma:** Al re-ejecutar el seed aparecen carpetas repetidas.
- **AcciÇün:** Limpia manualmente la carpeta raÇðz configurada en `GOOGLE_DRIVE_ROOT_FOLDER_ID` antes de reejecutar o ejecuta el seed con `SEED_CREATE_DRIVE_FOLDERS=false` para evitar nuevas carpetas.

## Webhooks mal configurados
- **SÇntoma:** El seed muestra `Webhook no configurado` o falla una jerarquÇða especÇðfica (universidad/facultad/carrera/curso/comisiÇün).
- **AcciÇün:** Revisa las variables `N8N_CREATE_*_FOLDER_WEBHOOK` en `backend/.env`. Copia las URLs de producciÇün de cada webhook en n8n.

## Credenciales de Google invÇlidas
- **SÇntoma:** n8n responde con errores de autenticaciÇün o permisos.
- **AcciÇün:** Refresca las credenciales OAuth2 de Drive/Sheets en n8n y confirma que `GOOGLE_DRIVE_ROOT_FOLDER_ID` es accesible por esas credenciales.

## Seed sin Drive
- **Uso intencional:** Configura `SEED_CREATE_DRIVE_FOLDERS=false` si solo quieres poblar MongoDB (mÇ§s rÇ­pido y sin dependencias externas). El seed no se bloquearÇ­ si n8n estÇ­ apagado, pero mostrarÇ­ warnings.

import { app } from './app'

import { exec } from 'child_process'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

console.log("[startup] Variables d'environnement chargées.")

const port = process.env.PORT || 3000
console.log(`[startup] Démarrage du serveur sur le port ${port}...`)
app.listen(port, () => {
  console.log(`Server started on port ${port}`)
})

function getTimestamp() {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
}

function backupDatabase() {
  console.log('[startup] Vérification de la sauvegarde MySQL...')
  const timestamp = getTimestamp()
  const backupDir = path.join(process.cwd(), 'database_backups')
  const backupPath = path.join(backupDir, `mysql_backup_${timestamp}.sql`)

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const dbUser = process.env.DB_USER
  const dbPassword = process.env.DB_PASS
  const dbName = process.env.DB_NAME
  const dbHost = process.env.DB_HOST
  const dbPort = process.env.DB_PORT || '3306'

  if (!dbUser || !dbPassword || !dbName || !dbHost) {
    console.error('Missing database credentials in environment variables.')
    return
  }

  console.log(`[startup] Lancement du backup MySQL vers ${backupPath}`)
  const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p'${dbPassword}' ${dbName} > ${backupPath}`

  exec(command, (error) => {
    if (!error) {
      console.log('MySQL database backup created:', backupPath)
      return
    }

    console.error('MySQL database backup failed.')
  })
}

console.log('[startup] Lancement du premier backup MySQL.')
backupDatabase()

console.log('[startup] Planification du backup MySQL toutes les heures.')
setInterval(backupDatabase, 60 * 60 * 1000)


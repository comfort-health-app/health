
/* eslint-disable @typescript-eslint/no-var-requires */
function uniqArray(array) {
  const knownElements = new Set()
  for (const elem of array) {
    knownElements.add(elem) // 同じ値を何度追加しても問題ない
  }
  return Array.from(knownElements)
}

const readline = require('readline')
const fs = require('fs')
const path = require('path')


const input = process.stdin
const output = process.stdout
const rl = readline.createInterface({ input, output })




const fileNamesInSchema = fs.readdirSync('prisma/schema');
const fileNamesInAppDir = fs.readdirSync('./src/app/(apps)');





let allApps = [
  ...fileNamesInSchema, ...fileNamesInAppDir,
].map(d => d.replace(/\..+/, "")).filter(d => d && d !== `schema`).sort()

allApps = uniqArray(allApps)






rl.question('作業をするアップを指定してください: ', answer => {

  rl.close()
  setEnvDatabase(answer)
  rewriteSettingJson(answer)


})

const rewriteSettingJson = async (targetApp) => {
  const settingsPath = path.join(process.cwd(), '.vscode', 'settings.json')

  const settingJsonStr = fs.readFileSync(settingsPath, 'utf8')
  const settingObject = JSON.parse(settingJsonStr)
  const searchExclude = settingObject['search.exclude']


  allApps.forEach(appName => {
    const key = `**/${appName}/**`




    if (targetApp) {
      if (appName == targetApp) {

        delete searchExclude[key]
      } else {
        searchExclude[key] = true
      }
    } else {
      delete searchExclude[key]
    }
  })


  settingObject['search.exclude'] = searchExclude
  settingObject[`typescript.preferences.autoImportFileExcludePatterns`] = allApps.filter((pattern) => {
    return !pattern.includes(targetApp)
  })



  const newJson = JSON.stringify(settingObject, null, 2)

  fs.writeFileSync(settingsPath, newJson, 'utf8')

  // URLを開く
  const url = `http://localhost:3000/${targetApp}`
  console.log(url)



}


const setEnvDatabase = async (targetApp) => {
  const envFile = path.join(`./.env`)
  const envFileStr = fs.readFileSync(envFile, 'utf8')
  const toArr = envFileStr.split('\n')

  if (targetApp) {

    const resultARr = toArr.map((line) => {
      if (line.includes('mutsuo:timeSpacer817@localhost:5432')) {
        const envKey = line.includes('DATABASE_URL') ? 'DATABASE_URL' : 'DIRECT_URL'
        const newLine = `${envKey}=postgres://mutsuo:timeSpacer817@localhost:5432/${targetApp}`
        return newLine

      }

      return line
    })
    const newEnvStr = resultARr.join('\n')
    fs.writeFileSync(envFile, newEnvStr, 'utf8')
  }





}

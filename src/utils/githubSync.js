import { Octokit } from '@octokit/rest'

const REPO_NAME = 'dev-room-data'
const FILE_PATH = 'dev-room-data.json'

// Garante que o repositório existe, senão cria
export async function ensureRepo(octokit, userLogin) {
  try {
    await octokit.repos.get({ owner: userLogin, repo: REPO_NAME })
  } catch {
    await octokit.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      private: true,
      description: 'Backup dos dados do Dev Room'
    })
  }
}

// Salva os dados no repositório do usuário
export async function saveDataToRepo(githubToken, userLogin, data) {
  const octokit = new Octokit({ auth: githubToken })
  await ensureRepo(octokit, userLogin)
  let sha
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: userLogin,
      repo: REPO_NAME,
      path: FILE_PATH
    })
    sha = fileData.sha
  } catch (err) {
    if (err.status !== 404) throw err
  }
  await octokit.repos.createOrUpdateFileContents({
    owner: userLogin,
    repo: REPO_NAME,
    path: FILE_PATH,
    message: 'Atualizando dados do Dev Room',
    content: btoa(unescape(encodeURIComponent(data))),
    sha
  })
}

// Carrega os dados do repositório do usuário
export async function loadDataFromRepo(githubToken, userLogin) {
  const octokit = new Octokit({ auth: githubToken })
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: userLogin,
      repo: REPO_NAME,
      path: FILE_PATH
    })
    return decodeURIComponent(escape(atob(fileData.content)))
  } catch (err) {
    if (err.status === 404) {
      return '{}'
    }
    throw err
  }
}
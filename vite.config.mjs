import chokidar from 'chokidar'
import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import handlebars from 'vite-plugin-handlebars'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const projectName = 'os3d'

  const basePath = mode === 'localbuild' ? './' : '/'

  const pagesPath = path.resolve(__dirname, 'src')
  const pageFiles = fs.readdirSync(pagesPath)
    .filter(file => file.endsWith('.html') && file !== 'link-page.html')

  const pageMetaList = pageFiles.map(file => {
    const filePath = path.join(pagesPath, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').slice(0, 10)
    const meta = {}
    lines.forEach(line => {
      const match = line.match(/@(\w+)\s+(.+?)\s*-->/)
      if (match) {
        const [, key, value] = match
        meta[key] = value.trim()
      }
    })
    return {
      name: file,
      title: meta.pageTitle || path.basename(file, '.html'),
      note: meta.pageNote || '',
      created: meta.pageCreated || '',
      updated: meta.pageUpdated || ''
    }
  })

  console.log('🧪 현재 빌드 모드:', mode);

  const isLocalBuild = mode === 'localbuild'

  return {
    root: 'src',
    base: './',
    publicDir: '../public',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      assetsInlineLimit: 0,
      minify: isLocalBuild ? false : 'esbuild',
      sourcemap: isLocalBuild,
      esbuild: {
        minify: false
      },
      terserOptions: {
        compress: false,
        mangle: false,
        format: {
          beautify: true,
          indent_level: 2
        }
      },
      rollupOptions: {
        input: Object.fromEntries(
          glob.sync('src/*.html').map(file => {
            const name = path.basename(file, '.html')
            return [name, path.resolve(__dirname, file)]
          })
        ),
        output: {
          entryFileNames: 'assets/js/[name].js',
          chunkFileNames: 'assets/js/[name].js',
          assetFileNames: ({ name }) => {
            if (/\.(css)$/.test(name ?? '')) {
              return 'assets/css/main[extname]'
            }
            if (/\.(png|jpe?g|gif|svg|webp)$/.test(name ?? '')) {
              return 'assets/images/[name][extname]'
            }
            return 'assets/[name][extname]'
          },
          manualChunks(id) {
            if (id.includes('/src/js/common/')) {
              return 'common'
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      handlebars({
        partialDirectory: path.resolve(__dirname, 'src/components'),
        context: {
          pages: pageMetaList
        }
      }),
      {
        name: 'watch-handlebars-partials',
        configureServer(server) {
          const partialsDir = path.resolve(__dirname, 'src/components')
          const watcher = chokidar.watch(partialsDir, {
            ignoreInitial: true
          })
          watcher.on('all', () => {
            server.ws.send({
              type: 'full-reload'
            })
          })
        }
      },
      {
        name: 'cleanup-html',
        closeBundle() {
          const distPath = path.resolve(__dirname, 'dist')
          if (!fs.existsSync(distPath)) return

          const htmlFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.html'))

          htmlFiles.forEach(file => {
            const filePath = path.join(distPath, file)
            let content = fs.readFileSync(filePath, 'utf-8')
            content = content.replace(/ crossorigin/g, '')
            content = content.replace(/<link rel="modulepreload" [^>]+?>/g, '')
            fs.writeFileSync(filePath, content)
          })

          console.log('✅ 빌드 후 modulepreload & crossorigin 제거 완료')
        }
      }
    ],
  }
})

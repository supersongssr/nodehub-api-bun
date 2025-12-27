# version 0



- [x] 开发计划更新
    - where: @README.md 
    - how : 
        - 在 Elysia 中，这通常是通过 @elysiajs/swagger 插件 api调试
        - 我建议将 src/modules/config/templates/ 软链接或同步到根目录的 configs/ , 根目录的 configs/ 方便用户在部署后直接修改（通过 Docker 挂载），而 src/ 下的代码在构建成二进制或压缩后不方便修改。
        - configs/ 改为 templates/ , 避免 config configs 两个文件夹的困惑
        - response 中添加 error 项 
        - docker 部署改为 podman 部署


## v0 change

- [x] .env 放私密参数,  非私密参数放到 config.toml 中
    - where: @config 
    - why : 私密参数 放到 .env 可以保证 安全,隐私不泄漏. 而配置参数可以放到 config.toml 中
    - how : 
        - 下面这些不是私密参数的, 放到 config.toml 中去. 
            # Notification Settings
            NOTIFY_ON_NODE_OFFLINE=true
            NOTIFY_ON_LOW_DISK=true
            DISK_THRESHOLD=90
            
            # DNS Check Interval (seconds)
            DOMAIN_DNS_CHECK_INTERVAL=300
        - panels 列表 放到 config.toml 
        - panel ssp srp url 放到 .env
        - 在 config.toml 通过 大写来引入 环境变量,也是变相在 config.toml 中标注哪些变量在 .env 中.(因为 .env 不上传)
        - 环境变量 有两个读取方式: 1是 项目根目录的 .env 文件, 另一个是 环境变量! 
            - 更换 .env 文件的位置到 根目录. 
        - ! 你自己可以读取和写入文件, 不需要使用 grep . 
        - 需要用到的变量和参数都在 config.toml 表现出来,使用  $VARIABLE 占位符号 像这样 :
            cloudflare_api_token = "$CLOUDFLARE_API_TOKEN"
    - must:
        - 所有涉及到 私密 token 密钥等信息的, 放到 .env . 
        - 可变参数,放到 config.toml 
        - 同步更新 .env 

- [x] .env dns api 描述不清
    - where : config/.env.example
    - why : cloudflare 支持 token 来设置 dns, DNS_API_KEY= DNS_API_SECRET= 表述不清, 同时未来支持 多个 dns服务商, 不方便
    - how :
        - 兼容 cloudflare token 
        - 同步修改 config/.env 

## v0 debug 

- [x] db 初始化报错:

    root@ssp196:~/git/nodehub-api-bun# bun run db:push
    $ drizzle-kit push
    Failed to find Response internal state key
    error: unknown command 'push'
    (Did you mean push:pg?)
    error: script "db:push" exited with code 1
    root@ssp196:~/git/nodehub-api-bun#

- [x] bun install 报错: 
    - how: 请尝试将 better-sqlite3 换成 Bun 内置的 bun:sqlite , bun:sqlite 无需编译, bun自带. 
    

root@ssp196:~/git/nodehub-api-bun# bun install
bun install v1.3.5 (1e86cebd)
  ⚙️  better-sqlite3 [1/2]

(node:1135071) [DEP0176] DeprecationWarning: fs.R_OK is deprecated, use fs.constants.R_OK instead
(Use `node --trace-deprecation ...` to show where the warning was created)
prebuild-install warn install No prebuilt binaries found (target=24.12.0 runtime=node arch=x64 libc= platform=linux)
gyp info it worked if it ends with ok
gyp info using node-gyp@12.1.0
gyp info using node@24.12.0 | linux | x64
gyp info find Python using Python version 3.11.2 found at "/usr/bin/python3"
gyp http GET https://nodejs.org/download/release/v24.12.0/node-v24.12.0-headers.tar.gz
gyp http 200 https://nodejs.org/download/release/v24.12.0/node-v24.12.0-headers.tar.gz
gyp http GET https://nodejs.org/download/release/v24.12.0/SHASUMS256.txt
gyp http 200 https://nodejs.org/download/release/v24.12.0/SHASUMS256.txt
gyp info spawn /usr/bin/python3
gyp info spawn args [
gyp info spawn args '/tmp/bunx-0-node-gyp@latest/node_modules/node-gyp/gyp/gyp_main.py',
gyp info spawn args 'binding.gyp',
gyp info spawn args '-f',
gyp info spawn args 'make',
gyp info spawn args '-I',
gyp info spawn args '/root/git/nodehub-api-bun/node_modules/better-sqlite3/build/config.gypi',
gyp info spawn args '-I',
gyp info spawn args '/tmp/bunx-0-node-gyp@latest/node_modules/node-gyp/addon.gypi',
gyp info spawn args '-I',
gyp info spawn args '/root/.cache/node-gyp/24.12.0/include/node/common.gypi',
gyp info spawn args '-Dlibrary=shared_library',
gyp info spawn args '-Dvisibility=default',
gyp info spawn args '-Dnode_root_dir=/root/.cache/node-gyp/24.12.0',
gyp info spawn args '-Dnode_gyp_dir=/tmp/bunx-0-node-gyp@latest/node_modules/node-gyp',
gyp info spawn args '-Dnode_lib_file=/root/.cache/node-gyp/24.12.0/<(target_arch)/node.lib',
gyp info spawn args '-Dmodule_root_dir=/root/git/nodehub-api-bun/node_modules/better-sqlite3',
gyp info spawn args '-Dnode_engine=v8',
gyp info spawn args '--depth=.',
gyp info spawn args '--no-parallel',
gyp info spawn args '--generator-output',
gyp info spawn args 'build',
gyp info spawn args '-Goutput_dir=.'
gyp info spawn args ]
gyp ERR! build error
gyp ERR! stack Error: not found: make
gyp ERR! stack at getNotFoundError (/tmp/bunx-0-node-gyp@latest/node_modules/which/lib/index.js:16:17)
gyp ERR! stack at which (/tmp/bunx-0-node-gyp@latest/node_modules/which/lib/index.js:77:9)
gyp ERR! stack at async doWhich (/tmp/bunx-0-node-gyp@latest/node_modules/node-gyp/lib/build.js:120:22)
gyp ERR! stack at async loadConfigGypi (/tmp/bunx-0-node-gyp@latest/node_modules/node-gyp/lib/build.js:78:7)
gyp ERR! stack at async build (/tmp/bunx-0-node-gyp@latest/node_modules/node-gyp/lib/build.js:36:3)
gyp ERR! stack at async run (/tmp/bunx-0-node-gyp@latest/node_modules/node-gyp/bin/node-gyp.js:81:18)
gyp ERR! System Linux 6.1.0-21-amd64
gyp ERR! command "/root/.local/share/fnm/node-versions/v24.12.0/installation/bin/node" "/tmp/bunx-0-node-gyp@latest/node_modules/.bin/node-gyp" "rebuild" "--release"
gyp ERR! cwd /root/git/nodehub-api-bun/node_modules/better-sqlite3
gyp ERR! node -v v24.12.0
gyp ERR! node-gyp -v v12.1.0
gyp ERR! not ok

error: install script from "better-sqlite3" exited with 1
root@ssp196:~/git/nodehub-api-bun#

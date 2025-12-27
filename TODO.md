# version 0

- [x] 开发计划更新
    - where: @README.md 
    - how : 
        - 在 Elysia 中，这通常是通过 @elysiajs/swagger 插件 api调试
        - 我建议将 src/modules/config/templates/ 软链接或同步到根目录的 configs/ , 根目录的 configs/ 方便用户在部署后直接修改（通过 Docker 挂载），而 src/ 下的代码在构建成二进制或压缩后不方便修改。
        - configs/ 改为 templates/ , 避免 config configs 两个文件夹的困惑
        - response 中添加 error 项 
        - docker 部署改为 podman 部署

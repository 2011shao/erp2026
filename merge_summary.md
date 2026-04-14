此次合并引入了一个完整的多店铺手机实体店铺ERP系统，基于Uniapp + TypeScript技术栈，包含前端框架、后端云函数、数据库配置等完整架构。项目覆盖了店铺管理、库存管理、销售管理等核心功能模块，并提供了完整的项目文档。
| 文件 | 变更 |
|------|---------|
| .gitignore | - 新增标准的Git忽略文件，包含node_modules、构建文件、日志、环境变量等常见忽略项 |
| README.md | - 新增项目说明文档，包含技术栈、核心功能模块、用户角色、开发计划等完整项目信息 |
| package.json | - 新增项目依赖配置，包含Uniapp、Pinia、uView Plus等核心依赖 |
| src/App.vue | - 新增应用主组件，包含路由守卫和全局导航拦截功能 |
| src/main.ts | - 新增应用入口文件，初始化Vue应用和Pinia状态管理 |
| src/pages/login/index.vue | - 新增登录页面，包含用户名密码输入和登录逻辑 |
| src/pages/dashboard/index.vue | - 新增首页仪表盘，包含销售统计、库存总量等数据展示和功能菜单 |
| src/api/request.ts | - 新增API请求封装，支持GET、POST、PUT、DELETE方法和token认证 |
| src/store/user.ts | - 新增用户状态管理，包含token存储、用户信息管理和登录/登出功能 |
| src/uniCloud/cloudfunctions/login/index.js | - 新增登录云函数，使用uniID进行用户认证 |
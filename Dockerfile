# 使用Nginx作为Web服务器
FROM nginx:alpine

# 复制游戏文件到Nginx的html目录
COPY frontend/ /usr/share/nginx/html/

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
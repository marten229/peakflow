FROM nginx:alpine

# Kopiert den aktuellen Pfad (HTML, CSS, JS) in das Nginx-Verzeichnis
COPY . /usr/share/nginx/html

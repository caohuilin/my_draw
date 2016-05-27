devd:
	bash -c "sleep 2 && open http://l:7777/page-redux/" &
	cd front/ && devd -a -p 7777  /v1/=http://localhost:8000/v1/ .

backend:
	cd service && npm start


build-front:
	cd front && npm run release


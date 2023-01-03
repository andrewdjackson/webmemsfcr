package main

import (
	"github.com/go-martini/martini"
	"log"
	"net/http"
)

func main() {
	martini_server()
}

func martini_server() {
	server := martini.Classic()
	//server.Use(martini.Static("./static"))
	server.Use(martini.Static("./static", martini.StaticOptions{Fallback: "index.html", Prefix: "/static/"}))

	//server.Use(martini.Static("./tenmplates"))
	server.Use(martini.Static("./templates", martini.StaticOptions{Prefix: "/templates/"}))
	//	server.Use(nocache.UpdateCacheHeaders())

	//log.Fatal(http.ListenAndServe(":8081", nil))
	server.RunOnAddr(":8081")
}

func go_server() {
	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.Handle("/templates/", http.StripPrefix("/templates/", http.FileServer(http.Dir("./templates"))))
	log.Fatal(http.ListenAndServe(":8081", nil))
}

package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

/*
* In an http.HandlerFunc, the http.ResponseWriter value (named w) is used to control
* the response information being written back to the client that made the request, such as
* the body of the response or the status code.
 */
/*
* The *http.Request value (named r) is used to get information about the request that came
* into the server, such as the body being sent in the case of a POST request
* or information about the client that made the request.
 */

func getRoot(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / request\n")
	io.WriteString(w, "This is my website\n")
}
func getHello(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got /hello request!\n")
	io.WriteString(w, "Hello, HTTP!\n")
}

func main() {
	const addr = "127.0.0.1"
	const port = "3333"
	http.HandleFunc("/", getRoot)
	http.HandleFunc("/hello", getHello)

	/**
	* ch <- v    Send v to channel ch.
	* v := <-ch  Receive from ch, and assign value to v.
	 */
	c := make(chan error)
	/** The ListenAndServe uses nil as http.Handler:
	* This tells the ListenAndServe function that you want to use the default
	* server multiplexer and not the one you’ve set up.
	 */
	go http.ListenAndServe(addr+":"+port, nil)
	fmt.Println("Server started at", addr+":"+port)
	err := <-c

	/**
	* http.ErrServerClosed, is returned when the server is told to shut down or close.
	* In the second error check, you check for any other error.
	 */
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("Server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	shell "github.com/ipfs/go-ipfs-api"
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

func uploadOfferingMsg(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got /upload request!\n")
	io.WriteString(w, "Hello, HTTP upload!\n")

	// Parse our multipart form, 10 << 20 specifies a maximum
	// upload of 10 MB files.
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		fmt.Println("err", err)
		return
	}
	// FormFile returns the first file for the given key `myFile`
	// it also returns the FileHeader so we can get the Filename,
	// the Header and the size of the file
	file, handler, err := r.FormFile("file")
	if err != nil {
		fmt.Println("Error Retrieving the File")
		fmt.Println(err)
		return
	}
	defer file.Close()
	fmt.Printf("Uploaded File: %+v\n", handler.Filename)
	fmt.Printf("File Size: %+v\n", handler.Size)
	fmt.Printf("MIME Header: %+v\n", handler.Header)

	// read all of the contents of our uploaded file into a
	// byte array
	fileBytes, err := ioutil.ReadAll(file)
	fmt.Println(string(fileBytes))
	if err != nil {
		fmt.Println(err)
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")

	// local node is running on localhost:5001
	sh := shell.NewShell("localhost:5001")
	cid, err := sh.Add(strings.NewReader(string(fileBytes)))
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %s", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(handler.Filename + " done, err " + err.Error())
	} else {
		fmt.Printf("added %s\n", cid)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(handler.Filename + " done, CID " + cid)
	}
}

func main() {

	const addr = "192.168.94.194"
	const port = "3333"

	http.HandleFunc("/uploadOfferingMsg", uploadOfferingMsg)

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

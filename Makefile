all: dist/project.min.js

clean:
	rm -f dist/*js

dist/project.min.js: dist/project.js
	closure-compiler --js dist/project.js >dist/project.min.js

dist/project.js: src/project.js
	cp src/project.js dist/project.js

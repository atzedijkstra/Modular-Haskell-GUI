PROJ = paper

$(PROJ).pdf: $(PROJ).tex $(PROJ).bib
	pdflatex $(PROJ).tex
	pdflatex $(PROJ).tex
	bibtex $(PROJ)
	pdflatex $(PROJ).tex
	

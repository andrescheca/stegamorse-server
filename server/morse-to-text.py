#!/usr/bin/python
import matplotlib
matplotlib.use('Agg')
import scipy.io.wavfile as wavfile
import csv
import os
from matplotlib.pyplot import *
from numpy import *


class Plotter:
    def specgram(self, signal):
        return specgram(signal)

class SoundFile:
    def __init__(self, path):
        # Read the wav file
        the_file = wavfile.read(path)
        self.rate = the_file[0]
        self.length = len(the_file[1])
        self.data = the_file[1]
        power = 10
        while pow(2, power) < self.length:
            power += 1
        self.data = append(self.data, zeros(pow(2, power) - self.length))

    def setdata(self, data):
        self.data = data

    def getdata(self):
        return self.data

    def getlength(self):
        return self.length

    def saveas(self, path):
        wavfile.write(path, self.rate, self.data)

class SpectreAnalyzer:
    def spectrogram(self, signal):
        spectrogram = plotter.specgram(signal)
        return spectrogram

    def sumarizecolumns(self, mat):
        vec_ones = ones(len(mat))
        vec_sum = (matrix(vec_ones) * matrix(mat)).transpose()
        return vec_sum

    def findpresence(self, vec_sum):
        presence = zeros(len(vec_sum))
        threshold = max(vec_sum) / 2.0
        for i in range(len(presence)):
            if vec_sum[i] > threshold:
                presence[i] = 1
        return presence

    def findpulses(self, soundfile):
        spec = self.spectrogram(soundfile.getdata())
        red_matrix = spec[0]
        vec_sum = self.sumarizecolumns(red_matrix)
        presence = self.findpresence(vec_sum)
        return presence


class ShortLong:
    def __init__(self, shorts, longs):
        self.shortmean = mean(shorts)
        self.shortstd = std(shorts)
        self.longmean = mean(longs)
        self.longstd = std(longs)

    def tostring(self):
        return "short: (" + repr(self.shortmean) + ", " + repr(
            self.shortstd) + ")\n\
long: (" + repr(self.longmean) + ", " + repr(self.longstd) + ")"


class PulsesAnalyzer:
    def compress(self, pulses):
        vec = []
        i = 0

        if pulses[0] == 1:
            vec += [0]
            i = 1

        last = pulses[0]

        while i < len(pulses):
            c = 0
            last = pulses[i]
            while i < len(pulses) and pulses[i] == last:
                i += 1
                c += 1
            vec += [c]
            i += 1

        vec = vec[1:-1]
        return vec

    def split(self, vec):
        onesl = zeros(1 + len(vec) // 2)
        zerosl = zeros(len(vec) // 2)
        for i in range(len(vec) // 2):
            onesl[i] = vec[2 * i]
            zerosl[i] = vec[2 * i + 1]
        if (len(vec) > 0):
            onesl[-1] = vec[-1]
        return (onesl, zerosl)

    def findshortlongdup(self, vec):
        sor = sort(vec)
        if len(sor) > 0:
            last = sor[0]
            for i in range(len(sor))[1:]:
                if sor[i] > 2 * last:
                    shorts = sor[:i - 1]
                    longs = sor[i:]
                    return (shorts, longs)
        return (vec, [])

    def createshortlong(self, shorts, longs):
        return ShortLong(shorts, longs)

    def findshortlong(self, vec):
        dup = self.findshortlongdup(vec)
        return self.createshortlong(dup[0], dup[1])


class SymbolDecoder:
    def __init__(self, onessl, zerossl, zeroextra=None):
        self.onessl = onessl
        self.zerossl = zerossl
        self.zeroextra = zeroextra

    def get(self, sl, n, ifshort, iflong, ifnone="?"):
        d = 4
        offset = 2
        if (n + offset >= sl.shortmean - d * sl.shortstd) and (
                n - offset <= sl.shortmean + d * sl.shortstd):
            return ifshort
        if (n + offset >= sl.longmean - d * sl.longstd) and (
                n - offset <= sl.longmean + d * sl.longstd):
            return iflong
        return ifnone

    def getonesymbol(self, n):
        return self.get(self.onessl, n, ".", "-")

    def getzerosymbol(self, n):
        sym = self.get(self.zerossl, n, "", " ")
        if sym == "":
            return sym
        return self.get(self.zeroextra, n, " ", " | ", ifnone=" ")


class PulsesTranslator:
    def tostring(self, pulses):
        pa = PulsesAnalyzer()
        comp_vec = pa.compress(pulses)
        comp_tup = pa.split(comp_vec)

        onessl = pa.findshortlong(comp_tup[0])

        # zeros are subdivided
        dup = pa.findshortlongdup(comp_tup[1])
        zerossl = pa.createshortlong(dup[0], dup[1])
        dup2 = pa.findshortlongdup(dup[1])
        zeroextra = pa.createshortlong(dup2[0], dup2[1])
        symdec = SymbolDecoder(onessl, zerossl, zeroextra)
        s = ""
        for i in range(len(comp_vec) // 2):
            s += symdec.getonesymbol(comp_vec[2 * i])
            s += symdec.getzerosymbol(comp_vec[2 * i + 1])
        if (len(comp_vec) > 0):
            s += symdec.getonesymbol(comp_vec[-1])
        return s


class Codes:
    def __init__(self, path):
        file_path = os.path.dirname(os.path.realpath(__file__)) + "/" + path
        data = csv.DictReader(
            open(file_path), delimiter=',', fieldnames=["char", "code"])
        self.dic = {}
        for entry in data:
            self.dic[entry["code"]] = entry["char"]

    def tochar(self, code):
        if self.dic.has_key(code):
            return self.dic[code]
        return "?"


class StringTranslator:
    def __init__(self):
        self.codes = Codes("codes.csv")

    def totext(self, s):
        text = ""
        for code in s.split():
            if code == "|":
                char = " "
            else:
                char = self.codes.tochar(code)
            text += char
        return text


if len(sys.argv) < 2:
    print "Usage: " + sys.argv[0] + " soundfile.wav"
    sys.exit(1)

plotter = Plotter()

the_file = SoundFile(sys.argv[1])

analyzer = SpectreAnalyzer()
pulses = analyzer.findpulses(the_file)

pul_translator = PulsesTranslator()
code_string = pul_translator.tostring(pulses)

str_translator = StringTranslator()
s = str_translator.totext(code_string)

# print code_string
print s

#include <iostream>
#include <fstream>
#include <vector>

// This is a dummy compressor.
// Replace this with your real Huffman compression logic.

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "Usage: compressor <input_file> <output_file>\n";
        return 1;
    }

    std::ifstream fin(argv[1], std::ios::binary);
    if (!fin) {
        std::cerr << "Failed to open input file.\n";
        return 1;
    }

    std::ofstream fout(argv[2], std::ios::binary);
    if (!fout) {
        std::cerr << "Failed to open output file.\n";
        return 1;
    }

    std::vector<char> buffer((std::istreambuf_iterator<char>(fin)), std::istreambuf_iterator<char>());
    // TODO: Compress buffer here with your Huffman algorithm

    // For now just copy input -> output
    fout.write(buffer.data(), buffer.size());

    fin.close();
    fout.close();
    std::cout << "Compression done.\n";
    return 0;
}

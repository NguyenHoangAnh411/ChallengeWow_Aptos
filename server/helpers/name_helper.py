from names_generator import generate_name


def generate_funny_username(
    wallet_address: str, words: int = 2, separator: str = "", capitalize: bool = True
) -> str:
    """Generate a username with a specific number of words and formatting."""
    name = generate_name(style="plain")

    word_list = [word for word in name.replace("-", " ").replace("_", " ").split()]
    if capitalize:
        word_list = [w.capitalize() for w in word_list]
    final_name = separator.join(word_list[:words])

    suffix = wallet_address[-4:] if wallet_address else "0000"
    return f"{final_name}#{suffix}"

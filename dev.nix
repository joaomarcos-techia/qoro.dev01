
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20
    # Adicione outras dependências do sistema aqui, se necessário
  ];

  packages = with pkgs; [
    stripe-cli
  ];

  shellHook = ''
    echo "Bem-vindo ao ambiente de desenvolvimento Qoro!"
    echo "Node.js e Stripe CLI estão disponíveis."
  '';
}

import { Link } from 'react-router-dom'

export function NaoEncontrada() {
  return (
    <div className="text-center py-5">
      <p className="display-6 mb-2">Página não encontrada</p>
      <p className="text-secondary">O endereço acessado não existe nesta aplicação.</p>
      <Link className="btn btn-primary mt-2" to="/">
        Voltar para a área de trabalho
      </Link>
    </div>
  )
}

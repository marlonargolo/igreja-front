// src/services/externalApis.service.ts

// API de CEP - ViaCEP (gratuita)
export async function fetchAddressByCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    throw new Error('CEP inválido')
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }
    
    return {
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      complement: data.complemento
    }
  } catch (error) {
    throw new Error('Erro ao buscar CEP')
  }
}

// API de CNPJ - BrasilAPI (gratuita)
export async function fetchCompanyByCnpj(cnpj: string) {
  const cleanCnpj = cnpj.replace(/\D/g, '')
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ inválido')
  }
  
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
    
    if (!response.ok) {
      throw new Error('CNPJ não encontrado')
    }
    
    const data = await response.json()
    
    return {
      cnpj: data.cnpj,
      name: data.razao_social,
      fantasyName: data.nome_fantasia,
      street: data.logradouro,
      number: data.numero,
      neighborhood: data.bairro,
      city: data.municipio,
      state: data.uf,
      cep: data.cep,
      phone: data.ddd_telefone_1 || data.ddd_telefone_2,
      email: data.email,
      status: data.situacao_descricao,
      openingDate: data.data_inicio_atividade
    }
  } catch (error) {
    throw new Error('Erro ao buscar CNPJ')
  }
}
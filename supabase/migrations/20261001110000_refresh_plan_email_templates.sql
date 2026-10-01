-- Refresh the Admin email templates without sending messages or changing triggers, subjects, buttons or enabled states.
update public.customer_onboarding_templates t
set message = v.message, updated_at = now()
from (values
  ('account_welcome', 'Olá! Sua conta Kivai foi criada com sucesso e começa no Plano Grátis. Você pode analisar uma conta do Instagram por vez (até 50 mil seguidores) e usar calendário, briefing, QR Code, marca d’água e relatório Social Media. Calendário, briefing e relatório mantêm rascunhos neste navegador.

Se quiser salvar projetos na conta e abri-los em outros dispositivos, o Pro permite até 30 projetos e histórico de até 5 perfis do Instagram. O Agency amplia para até 200 projetos organizados por até 20 clientes e até 20 perfis.'),
  ('free_welcome', 'Olá! Seu Plano Grátis Kivai está disponível. Analise uma conta do Instagram por vez, com até 50 mil seguidores, e use calendário, briefing, QR Code, marca d’água e relatório Social Media sem assinatura. Calendário, briefing e relatório podem manter rascunhos neste navegador; o Grátis não inclui histórico do Instagram nem projetos salvos na conta.

Quando precisar continuar em outro dispositivo, o Pro oferece até 30 projetos na conta e histórico de até 5 perfis. O Agency amplia para 200 projetos, organização por até 20 clientes e até 20 perfis.'),
  ('pro_welcome', 'Olá! Seu pagamento foi confirmado e o Plano Pro Kivai já está ativo. Você pode acompanhar até 5 perfis do Instagram, com até 500 mil seguidores por perfil, manter histórico privado e comparar exportações oficiais da Meta. Para atualizar as análises, importe novas exportações; a coleta não é automática.

Salve até 30 projetos no total, entre calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media. Abra seus projetos em outros dispositivos com a mesma conta, duplique modelos e exporte projetos em JSON. Seus projetos Pro são pessoais, sem organização por cliente. Acesse sua Área Pro para começar.'),
  ('agency_welcome', 'Olá! Seu pagamento foi confirmado e o Plano Agency Kivai já está ativo. Você tem todos os recursos do Pro e pode acompanhar até 20 perfis do Instagram, com histórico e comparações separados por perfil. Atualize cada histórico importando novas exportações oficiais da Meta; a coleta não é automática.

Salve até 200 projetos no total, entre calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media. Organize os projetos por até 20 nomes de clientes, filtre a biblioteca por cliente e abra, duplique ou exporte os projetos em outro dispositivo com a mesma conta. A organização por cliente não inclui login de clientes ou aprovação externa.'),
  ('pro_test_welcome', 'Olá! Liberamos 7 dias de teste do Plano Pro Kivai. Durante esse período, acompanhe até 5 perfis do Instagram (até 500 mil seguidores por perfil), crie um histórico privado e compare as exportações oficiais da Meta que você importar.

Você também pode salvar até 30 projetos na conta, somando calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media, e abri-los em outro dispositivo. Aproveite para testar a duplicação de modelos. Ao final, você poderá assinar um plano para continuar criando e atualizando projetos na conta.'),
  ('pro_test_expiry', 'Olá! Hoje é o último dia do seu teste do Plano Pro Kivai. Você pôde acompanhar até 5 perfis do Instagram, comparar exportações da Meta e salvar até 30 projetos entre calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media.

Se o Pro ajudou sua rotina, assine para continuar criando e atualizando projetos na conta. Quando o acesso pago termina, os projetos já salvos continuam disponíveis para abrir, exportar ou excluir. Gostaríamos de saber o que você achou da experiência.')
) as v(template_key, message)
where t.template_key = v.template_key;

update public.customer_marketing_templates t
set message = v.message, updated_at = now()
from (values
  ('free_nurture', 'Olá! No Plano Grátis, você já pode analisar uma conta do Instagram por vez (até 50 mil seguidores) e usar calendário, briefing, QR Code, marca d’água e relatório Social Media.

Com o Pro, acompanhe até 5 perfis do Instagram, mantenha histórico privado, compare exportações da Meta e salve até 30 projetos dessas cinco ferramentas na conta para continuar em outro dispositivo. O Agency amplia para até 20 perfis, 200 projetos e organização por até 20 nomes de clientes. As análises são atualizadas com novas exportações importadas por você.'),
  ('pro_upgrade', 'Olá! O Plano Pro do Kivai reúne acompanhamento do Instagram e organização do seu trabalho. Analise até 5 perfis, com até 500 mil seguidores por perfil, mantenha histórico privado e compare as exportações oficiais da Meta para identificar mudanças entre períodos.

Salve até 30 projetos no total, entre calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media. Abra os projetos em outro dispositivo com sua conta, duplique modelos e exporte projetos em JSON. As análises são atualizadas quando você importa uma nova exportação; não há coleta automática.'),
  ('agency_upgrade', 'Olá! Se você administra várias contas ou clientes, o Plano Agency do Kivai amplia os recursos do Pro: acompanhe até 20 perfis do Instagram e mantenha históricos e comparações separados por perfil.

Salve até 200 projetos no total, entre calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media. Organize os projetos por até 20 nomes de clientes, filtre a biblioteca e abra ou duplique os trabalhos em outro dispositivo com a mesma conta. A organização por cliente não inclui login de clientes nem aprovação externa.'),
  ('renewal', '{{nome}}, seu Plano {{plano}} Kivai vence em {{dias}} dia(s), em {{data_vencimento}}. Renove para continuar atualizando o histórico do Instagram e salvando projetos na conta: calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media.

O Pro permite até 30 projetos e 5 perfis do Instagram; o Agency, até 200 projetos organizados por até 20 clientes e 20 perfis. Se o acesso vencer, os projetos já salvos ainda poderão ser abertos, exportados ou excluídos, mas novas gravações ficarão bloqueadas. Se houver pagamento em andamento, os avisos são pausados.'),
  ('winback', '{{nome}}, seu Plano {{plano}} venceu em {{data_vencimento}}. Liberamos uma cortesia de {{dias}} dias, válida até {{data_fim_cortesia}}, para você continuar atualizando seu histórico do Instagram e salvando projetos de calendário, briefing, QR Code, marca d’água e relatório Social Media.

No Pro, o limite é de 30 projetos e 5 perfis; no Agency, 200 projetos organizados por até 20 clientes e 20 perfis. Renove dentro da cortesia para manter o acesso sem nova interrupção. Depois do vencimento, os projetos existentes continuam disponíveis para abrir, exportar ou excluir, mesmo sem novas gravações.'),
  ('cross_sell', 'Olá! Os planos Pro e Agency oferecem histórico do Instagram e projetos salvos na conta para calendário, briefing, QR Code, marca d’água e relatório Social Media. O Pro permite até 30 projetos; o Agency, até 200 projetos organizados por até 20 clientes.

Se você também precisa de execução profissional, o Kivai oferece serviços contratados separadamente, como gestão de tráfego, landing pages e divulgação. Eles não fazem parte da assinatura das ferramentas. Conheça as opções e fale conosco para avaliar seu projeto.'),
  ('blog_digest', '<p>Tem conteúdo novo e interessante no Kivai.</p><p>Selecionamos três publicações recentes para você conferir:</p>{{links}}<p>Entre no blog para ver todas as novidades.</p><p>Para organizar seus projetos de conteúdo na conta, conheça os planos Pro e Agency: até 30 projetos no Pro ou 200 no Agency, com organização por cliente.</p>'),
  ('new_post', '<p>Tem conteúdo novo no Kivai.</p><h2>{{titulo}}</h2><p>{{resumo}}</p><p>Acesse a publicação para ler o conteúdo completo.</p><p>Para salvar projetos das ferramentas na conta, conheça o Pro (até 30) e o Agency (até 200, com organização por cliente).</p>'),
  ('new_tool', '<p>Tem ferramenta nova no Kivai.</p><h2>{{titulo}}</h2><p>{{resumo}}</p><p>Ela já está disponível para você usar.</p><p>As ferramentas gratuitas continuam disponíveis para todos. Pro e Agency também oferecem histórico do Instagram e salvamento na conta para as ferramentas compatíveis: até 30 projetos no Pro ou 200 no Agency, com organização por cliente.</p>')
) as v(flow_key, message)
where t.flow_key = v.flow_key;

-- Make the previously code-only plan overview visible and editable in Admin.
insert into public.customer_marketing_templates
(flow_key,title,subject,description,message,cta_label,cta_url,secondary_cta_label,secondary_cta_url,enabled,updated_at)
values ('plans_overview','Conheça os planos Kivai','Conheça os planos Kivai e os novos recursos de projetos',
'Apresenta Grátis, Pro e Agency com os recursos atuais de análise e projetos.','<p>Olá!</p>
<p>Os planos do Kivai combinam análise de perfis com recursos para organizar seus projetos de conteúdo.</p>
<h2>Plano Grátis</h2>
<ul>
<li>Análise local de uma conta do Instagram por vez, com até 50 mil seguidores</li>
<li>Calendário, briefing, QR Code, marca d’água e relatório Social Media disponíveis gratuitamente</li>
<li>Rascunhos de calendário, briefing e relatório neste navegador; sem histórico do Instagram ou projetos salvos na conta</li>
</ul>
<h2>Plano Pro</h2>
<ul>
<li>Até 5 perfis do Instagram e 500 mil seguidores por perfil</li>
<li>Histórico privado e comparação entre exportações oficiais da Meta importadas por você</li>
<li>Até 30 projetos no total: calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media</li>
<li>Projetos pessoais acessíveis em outros dispositivos, com duplicação de modelos e exportação JSON</li>
</ul>
<h2>Plano Agency</h2>
<ul>
<li>Até 20 perfis do Instagram</li>
<li>Histórico e comparação separados por perfil</li>
<li>Até 200 projetos das cinco ferramentas acima salvos na conta</li>
<li>Organização e filtro dos projetos por até 20 nomes de clientes</li>
<li>Todos os recursos do Pro, com acesso aos projetos em outros dispositivos</li>
</ul>
<p>As análises do Instagram dependem de novas exportações da Meta; não há coleta automática. Os nomes de clientes são para organização e não incluem login ou aprovação externa.</p>
<p>Escolha o plano que acompanha o tamanho da sua operação.</p>',
'Conhecer os planos','https://www.kivai.com.br/planos','Acessar minha conta','https://www.kivai.com.br/conta',true,now())
on conflict (flow_key) do update set message = excluded.message, updated_at = now();
